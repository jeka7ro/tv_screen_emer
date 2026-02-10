# Content Folders API Endpoints
# Add these to server.py after the content delete endpoint (around line 1344)

# ========== CONTENT FOLDERS ENDPOINTS ==========

@api_router.get("/content/folders", response_model=List[ContentFolder])
async def list_folders(current_user: User = Depends(get_current_user)):
    """List all content folders"""
    folders = await db.folder_list()
    return folders


@api_router.post("/content/folders", response_model=ContentFolder)
async def create_folder(
    folder_data: ContentFolderCreate,
    current_user: User = Depends(require_admin)
):
    """Create a new content folder"""
    folder = ContentFolder(
        name=folder_data.name,
        description=folder_data.description,
        color=folder_data.color or "#6366f1",
        icon=folder_data.icon or "folder"
    )
    await db.folder_insert(folder.model_dump())
    return folder


@api_router.patch("/content/folders/{folder_id}", response_model=ContentFolder)
async def update_folder(
    folder_id: str,
    folder_data: ContentFolderUpdate,
    current_user: User = Depends(require_admin)
):
    """Update a content folder"""
    existing = await db.folder_get_by_id(folder_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    # Update only provided fields
    update_data = folder_data.model_dump(exclude_unset=True)
    if update_data:
        await db.folder_update(folder_id, update_data)
    
    # Return updated folder
    updated = await db.folder_get_by_id(folder_id)
    return updated


@api_router.delete("/content/folders/{folder_id}")
async def delete_folder(
    folder_id: str,
    current_user: User = Depends(require_admin)
):
    """Delete a content folder (content items will be moved to root)"""
    existing = await db.folder_get_by_id(folder_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    await db.folder_delete(folder_id)
    return JSONResponse(content={"message": "Folder deleted, content moved to root"}, status_code=200)


@api_router.patch("/content/{content_id}/folder")
async def move_content_to_folder(
    content_id: str,
    move_data: MoveToFolder,
    current_user: User = Depends(require_admin)
):
    """Move content to a folder (or to root if folder_id is None)"""
    # Verify content exists
    content = await db.content_get(content_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Verify folder exists if folder_id is provided
    if move_data.folder_id:
        folder = await db.folder_get_by_id(move_data.folder_id)
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
    
    await db.content_update_folder(content_id, move_data.folder_id)
    return JSONResponse(content={"message": "Content moved successfully"}, status_code=200)
