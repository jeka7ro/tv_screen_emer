#!/bin/bash
# Automated Deployment Script for SushiMaster TV Screen
# This script triggers deployments on both Netlify (frontend) and Render (backend)

set -e  # Exit on error

echo "🚀 Starting automated deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration (set these as environment variables or edit here)
NETLIFY_SITE_ID="${NETLIFY_SITE_ID:-}"
NETLIFY_AUTH_TOKEN="${NETLIFY_AUTH_TOKEN:-}"
RENDER_SERVICE_ID="${RENDER_SERVICE_ID:-}"
RENDER_API_KEY="${RENDER_API_KEY:-}"

# Function to trigger Netlify deployment
trigger_netlify() {
    if [ -z "$NETLIFY_SITE_ID" ] || [ -z "$NETLIFY_AUTH_TOKEN" ]; then
        echo -e "${YELLOW}⚠️  Netlify credentials not configured. Skipping Netlify deploy.${NC}"
        echo "   Set NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN environment variables."
        return 1
    fi
    
    echo -e "${GREEN}📦 Triggering Netlify deployment...${NC}"
    
    RESPONSE=$(curl -s -X POST \
        "https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/builds" \
        -H "Authorization: Bearer ${NETLIFY_AUTH_TOKEN}" \
        -H "Content-Type: application/json")
    
    BUILD_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$BUILD_ID" ]; then
        echo -e "${GREEN}✅ Netlify build triggered: ${BUILD_ID}${NC}"
        echo "   Monitor at: https://app.netlify.com/sites/${NETLIFY_SITE_ID}/deploys"
        return 0
    else
        echo -e "${RED}❌ Failed to trigger Netlify deployment${NC}"
        echo "$RESPONSE"
        return 1
    fi
}

# Function to trigger Render deployment
trigger_render() {
    if [ -z "$RENDER_SERVICE_ID" ] || [ -z "$RENDER_API_KEY" ]; then
        echo -e "${YELLOW}⚠️  Render credentials not configured. Skipping Render deploy.${NC}"
        echo "   Set RENDER_SERVICE_ID and RENDER_API_KEY environment variables."
        return 1
    fi
    
    echo -e "${GREEN}🔧 Triggering Render deployment...${NC}"
    
    RESPONSE=$(curl -s -X POST \
        "https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys" \
        -H "Authorization: Bearer ${RENDER_API_KEY}" \
        -H "Content-Type: application/json" \
        -d '{"clearCache": "do_not_clear"}')
    
    DEPLOY_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$DEPLOY_ID" ]; then
        echo -e "${GREEN}✅ Render deployment triggered: ${DEPLOY_ID}${NC}"
        echo "   Monitor at: https://dashboard.render.com/"
        return 0
    else
        echo -e "${RED}❌ Failed to trigger Render deployment${NC}"
        echo "$RESPONSE"
        return 1
    fi
}

# Main execution
echo ""
echo "================================================"
echo "  SushiMaster TV Screen - Auto Deploy"
echo "================================================"
echo ""

# Trigger deployments
NETLIFY_SUCCESS=0
RENDER_SUCCESS=0

trigger_netlify && NETLIFY_SUCCESS=1 || true
echo ""
trigger_render && RENDER_SUCCESS=1 || true

echo ""
echo "================================================"
echo "  Deployment Summary"
echo "================================================"

if [ $NETLIFY_SUCCESS -eq 1 ]; then
    echo -e "${GREEN}✅ Netlify: Deployment triggered${NC}"
else
    echo -e "${YELLOW}⚠️  Netlify: Skipped or failed${NC}"
fi

if [ $RENDER_SUCCESS -eq 1 ]; then
    echo -e "${GREEN}✅ Render: Deployment triggered${NC}"
else
    echo -e "${YELLOW}⚠️  Render: Skipped or failed${NC}"
fi

echo ""

if [ $NETLIFY_SUCCESS -eq 1 ] || [ $RENDER_SUCCESS -eq 1 ]; then
    echo -e "${GREEN}🎉 Deployment(s) initiated successfully!${NC}"
    exit 0
else
    echo -e "${RED}❌ No deployments were triggered. Check your configuration.${NC}"
    exit 1
fi
