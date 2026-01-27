import requests
import sys
import json
from datetime import datetime

class SushiMasterAPITester:
    def __init__(self, base_url="https://menubytes.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'location': None,
            'screen': None,
            'product': None,
            'content': None,
            'playlist': None,
            'digital_menu': None
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for file uploads
                    headers.pop('Content-Type', None)
                    response = requests.post(url, data=data, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth(self):
        """Test authentication endpoints"""
        print("\n" + "="*50)
        print("TESTING AUTHENTICATION")
        print("="*50)
        
        # Test login with provided credentials
        success, response = self.run_test(
            "Login with test credentials",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@sushimaster.ro", "password": "admin123"}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            
            # Test get current user
            self.run_test(
                "Get current user",
                "GET",
                "auth/me",
                200
            )
            return True
        else:
            # Try to register the test user first
            print("   Login failed, trying to register test user...")
            success, response = self.run_test(
                "Register test user",
                "POST",
                "auth/register",
                200,
                data={
                    "email": "admin@sushimaster.ro", 
                    "password": "admin123",
                    "full_name": "Admin SushiMaster"
                }
            )
            
            if success and 'access_token' in response:
                self.token = response['access_token']
                print(f"   Token obtained after registration: {self.token[:20]}...")
                return True
            
        return False

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        print("\n" + "="*50)
        print("TESTING DASHBOARD STATS")
        print("="*50)
        
        self.run_test(
            "Get dashboard statistics",
            "GET",
            "dashboard/stats",
            200
        )

    def test_locations_crud(self):
        """Test locations CRUD operations"""
        print("\n" + "="*50)
        print("TESTING LOCATIONS CRUD")
        print("="*50)
        
        # Create location
        success, response = self.run_test(
            "Create location",
            "POST",
            "locations",
            200,
            data={
                "name": "SushiMaster Centru",
                "address": "Str. Victoriei 123",
                "city": "București",
                "status": "active",
                "timezone": "Europe/Bucharest",
                "security_code": "1234"
            }
        )
        
        if success and 'id' in response:
            location_id = response['id']
            self.created_ids['location'] = location_id
            
            # Get all locations
            self.run_test(
                "Get all locations",
                "GET",
                "locations",
                200
            )
            
            # Get specific location
            self.run_test(
                "Get specific location",
                "GET",
                f"locations/{location_id}",
                200
            )
            
            # Update location
            self.run_test(
                "Update location",
                "PUT",
                f"locations/{location_id}",
                200,
                data={
                    "name": "SushiMaster Centru Updated",
                    "address": "Str. Victoriei 123",
                    "city": "București",
                    "status": "active"
                }
            )

    def test_screens_crud(self):
        """Test screens CRUD operations"""
        print("\n" + "="*50)
        print("TESTING SCREENS CRUD")
        print("="*50)
        
        if not self.created_ids['location']:
            print("❌ Skipping screens test - no location created")
            return
            
        # Create screen
        success, response = self.run_test(
            "Create screen",
            "POST",
            "screens",
            200,
            data={
                "location_id": self.created_ids['location'],
                "name": "Ecran Principal",
                "slug": f"test-screen-{datetime.now().strftime('%H%M%S')}",
                "resolution": "1920x1080",
                "orientation": "landscape"
            }
        )
        
        if success and 'id' in response:
            screen_id = response['id']
            self.created_ids['screen'] = screen_id
            
            # Get all screens
            self.run_test(
                "Get all screens",
                "GET",
                "screens",
                200
            )
            
            # Get specific screen
            self.run_test(
                "Get specific screen",
                "GET",
                f"screens/{screen_id}",
                200
            )
            
            # Test screen heartbeat (public endpoint)
            self.run_test(
                "Screen heartbeat",
                "POST",
                f"screens/{screen_id}/heartbeat",
                200
            )

    def test_products_crud(self):
        """Test products CRUD operations"""
        print("\n" + "="*50)
        print("TESTING PRODUCTS CRUD")
        print("="*50)
        
        # Create product
        success, response = self.run_test(
            "Create product",
            "POST",
            "products",
            200,
            data={
                "name": "Sushi Salmon",
                "description": "Fresh salmon sushi with rice",
                "price": 25.50,
                "currency": "RON",
                "category": "sushi",
                "available": True,
                "featured": True,
                "order_index": 1
            }
        )
        
        if success and 'id' in response:
            product_id = response['id']
            self.created_ids['product'] = product_id
            
            # Get all products
            self.run_test(
                "Get all products",
                "GET",
                "products",
                200
            )
            
            # Get specific product
            self.run_test(
                "Get specific product",
                "GET",
                f"products/{product_id}",
                200
            )
            
            # Update product
            self.run_test(
                "Update product",
                "PUT",
                f"products/{product_id}",
                200,
                data={
                    "name": "Sushi Salmon Premium",
                    "description": "Premium fresh salmon sushi with rice",
                    "price": 30.00,
                    "currency": "RON",
                    "category": "sushi",
                    "available": True,
                    "featured": True
                }
            )

    def test_content_crud(self):
        """Test content CRUD operations"""
        print("\n" + "="*50)
        print("TESTING CONTENT CRUD")
        print("="*50)
        
        # Create external content
        success, response = self.run_test(
            "Create external content",
            "POST",
            "content/external",
            200,
            data={
                "title": "Promo Video",
                "type": "video",
                "file_url": "https://example.com/video.mp4",
                "duration": 30,
                "category": "promo",
                "tags": ["promotion", "sushi"]
            }
        )
        
        if success and 'id' in response:
            content_id = response['id']
            self.created_ids['content'] = content_id
            
            # Get all content
            self.run_test(
                "Get all content",
                "GET",
                "content",
                200
            )
            
            # Get specific content
            self.run_test(
                "Get specific content",
                "GET",
                f"content/{content_id}",
                200
            )

    def test_playlists_crud(self):
        """Test playlists CRUD operations"""
        print("\n" + "="*50)
        print("TESTING PLAYLISTS CRUD")
        print("="*50)
        
        # Create playlist
        success, response = self.run_test(
            "Create playlist",
            "POST",
            "playlists",
            200,
            data={
                "name": "Playlist Promo",
                "description": "Promotional content playlist",
                "items": [],
                "autoplay": True,
                "loop": True,
                "status": "active"
            }
        )
        
        if success and 'id' in response:
            playlist_id = response['id']
            self.created_ids['playlist'] = playlist_id
            
            # Get all playlists
            self.run_test(
                "Get all playlists",
                "GET",
                "playlists",
                200
            )
            
            # Get specific playlist
            self.run_test(
                "Get specific playlist",
                "GET",
                f"playlists/{playlist_id}",
                200
            )

    def test_digital_menus_crud(self):
        """Test digital menus CRUD operations"""
        print("\n" + "="*50)
        print("TESTING DIGITAL MENUS CRUD")
        print("="*50)
        
        # Create digital menu
        success, response = self.run_test(
            "Create digital menu",
            "POST",
            "digital-menus",
            200,
            data={
                "name": "Menu Principal",
                "selected_products": [self.created_ids['product']] if self.created_ids['product'] else [],
                "selected_categories": ["sushi"],
                "products_per_page": 6,
                "page_duration": 10,
                "auto_rotate": True,
                "status": "active"
            }
        )
        
        if success and 'id' in response:
            menu_id = response['id']
            self.created_ids['digital_menu'] = menu_id
            
            # Get all digital menus
            self.run_test(
                "Get all digital menus",
                "GET",
                "digital-menus",
                200
            )
            
            # Get specific digital menu
            self.run_test(
                "Get specific digital menu",
                "GET",
                f"digital-menus/{menu_id}",
                200
            )

    def test_screen_templates(self):
        """Test screen templates"""
        print("\n" + "="*50)
        print("TESTING SCREEN TEMPLATES")
        print("="*50)
        
        self.run_test(
            "Get screen templates",
            "GET",
            "screen-templates",
            200
        )

    def test_menu_templates(self):
        """Test menu templates"""
        print("\n" + "="*50)
        print("TESTING MENU TEMPLATES")
        print("="*50)
        
        self.run_test(
            "Get menu templates",
            "GET",
            "menu-templates",
            200
        )

    def test_display_endpoint(self):
        """Test public display endpoint"""
        print("\n" + "="*50)
        print("TESTING DISPLAY ENDPOINT")
        print("="*50)
        
        if self.created_ids['screen']:
            # Get screen data to find slug
            success, screen_data = self.run_test(
                "Get screen for display test",
                "GET",
                f"screens/{self.created_ids['screen']}",
                200
            )
            
            if success and 'slug' in screen_data:
                slug = screen_data['slug']
                # Test public display endpoint (no auth required)
                old_token = self.token
                self.token = None  # Remove auth for public endpoint
                
                self.run_test(
                    "Get display data (public)",
                    "GET",
                    f"display/{slug}",
                    200
                )
                
                self.token = old_token  # Restore auth

    def cleanup(self):
        """Clean up created test data"""
        print("\n" + "="*50)
        print("CLEANING UP TEST DATA")
        print("="*50)
        
        # Delete in reverse order of dependencies
        if self.created_ids['digital_menu']:
            self.run_test(
                "Delete digital menu",
                "DELETE",
                f"digital-menus/{self.created_ids['digital_menu']}",
                200
            )
            
        if self.created_ids['playlist']:
            self.run_test(
                "Delete playlist",
                "DELETE",
                f"playlists/{self.created_ids['playlist']}",
                200
            )
            
        if self.created_ids['content']:
            self.run_test(
                "Delete content",
                "DELETE",
                f"content/{self.created_ids['content']}",
                200
            )
            
        if self.created_ids['product']:
            self.run_test(
                "Delete product",
                "DELETE",
                f"products/{self.created_ids['product']}",
                200
            )
            
        if self.created_ids['screen']:
            self.run_test(
                "Delete screen",
                "DELETE",
                f"screens/{self.created_ids['screen']}",
                200
            )
            
        if self.created_ids['location']:
            self.run_test(
                "Delete location",
                "DELETE",
                f"locations/{self.created_ids['location']}",
                200
            )

def main():
    print("🚀 Starting SushiMaster TV API Tests")
    print("="*60)
    
    tester = SushiMasterAPITester()
    
    # Test authentication first
    if not tester.test_auth():
        print("\n❌ Authentication failed - stopping tests")
        return 1
    
    # Run all tests
    tester.test_dashboard_stats()
    tester.test_locations_crud()
    tester.test_screens_crud()
    tester.test_products_crud()
    tester.test_content_crud()
    tester.test_playlists_crud()
    tester.test_digital_menus_crud()
    tester.test_screen_templates()
    tester.test_menu_templates()
    tester.test_display_endpoint()
    
    # Cleanup
    tester.cleanup()
    
    # Print final results
    print("\n" + "="*60)
    print("📊 FINAL TEST RESULTS")
    print("="*60)
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Tests failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())