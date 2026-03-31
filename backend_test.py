import requests
import sys
import json
from datetime import datetime

class CRMAPITester:
    def __init__(self, base_url="https://multi-tenant-crm-42.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_credentials = {
            "email": "admin@crm.com",
            "password": "Admin@123"
        }
        self.test_user_credentials = {
            "email": f"test_user_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "name": "Test User",
            "tenantName": "Test Company"
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = self.session.post(url, files=files, data=data)
                else:
                    response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json() if response.content else {}
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "api/health", 200)

    def test_user_registration(self):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST",
            "api/auth/register",
            201,
            data=self.test_user_credentials
        )
        return success, response

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data=self.admin_credentials
        )
        return success, response

    def test_user_login(self):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "api/auth/login",
            200,
            data={
                "email": self.test_user_credentials["email"],
                "password": self.test_user_credentials["password"]
            }
        )
        return success, response

    def test_get_user_profile(self):
        """Test get current user profile"""
        return self.run_test("Get User Profile", "GET", "api/auth/me", 200)

    def test_logout(self):
        """Test logout"""
        return self.run_test("Logout", "POST", "api/auth/logout", 200)

    def test_create_dashboard(self):
        """Test dashboard creation"""
        dashboard_data = {
            "name": f"Test Dashboard {datetime.now().strftime('%H%M%S')}",
            "description": "Test dashboard for API testing",
            "excelSourcesCount": 2,
            "sourceNames": ["Sales Data", "Inventory Data"]
        }
        success, response = self.run_test(
            "Create Dashboard",
            "POST",
            "api/dashboards",
            201,
            data=dashboard_data
        )
        return success, response

    def test_get_dashboards(self):
        """Test get dashboards list"""
        return self.run_test("Get Dashboards", "GET", "api/dashboards", 200)

    def test_get_dashboard_by_id(self, dashboard_id):
        """Test get dashboard by ID"""
        return self.run_test(
            "Get Dashboard by ID",
            "GET",
            f"api/dashboards/{dashboard_id}",
            200
        )

    def test_update_dashboard(self, dashboard_id):
        """Test update dashboard"""
        update_data = {
            "name": f"Updated Dashboard {datetime.now().strftime('%H%M%S')}",
            "description": "Updated description"
        }
        return self.run_test(
            "Update Dashboard",
            "PUT",
            f"api/dashboards/{dashboard_id}",
            200,
            data=update_data
        )

    def test_delete_dashboard(self, dashboard_id):
        """Test delete dashboard"""
        return self.run_test(
            "Delete Dashboard",
            "DELETE",
            f"api/dashboards/{dashboard_id}",
            200
        )

    def test_excel_upload(self, dashboard_id):
        """Test Excel file upload (simulated)"""
        # Create a simple CSV content to simulate Excel upload
        csv_content = "Date,Store,Category,Amount\n2024-01-01,Store A,Electronics,1000\n2024-01-02,Store B,Clothing,500"
        
        files = {
            'file': ('test_data.csv', csv_content, 'text/csv')
        }
        data = {
            'dashboardId': dashboard_id,
            'sourceName': 'Sales Data'
        }
        
        success, response = self.run_test(
            "Excel Upload",
            "POST",
            "api/excel/upload",
            200,
            data=data,
            files=files
        )
        return success, response

    def test_get_excel_data(self, dashboard_id):
        """Test get Excel data"""
        return self.run_test(
            "Get Excel Data",
            "GET",
            f"api/excel/{dashboard_id}",
            200
        )

    def test_map_columns(self, excel_data_id):
        """Test column mapping"""
        mapping_data = {
            "excelDataId": excel_data_id,
            "columnMapping": {
                "date": "Date",
                "store": "Store",
                "category": "Category",
                "amount": "Amount"
            }
        }
        return self.run_test(
            "Map Columns",
            "POST",
            "api/excel/map-columns",
            200,
            data=mapping_data
        )

    def test_get_analytics(self, dashboard_id):
        """Test get analytics"""
        return self.run_test(
            "Get Analytics",
            "GET",
            f"api/analytics/{dashboard_id}",
            200
        )

    def test_get_filter_options(self, dashboard_id):
        """Test get filter options"""
        return self.run_test(
            "Get Filter Options",
            "GET",
            f"api/analytics/{dashboard_id}/filters",
            200
        )

    def test_get_raw_data(self, dashboard_id):
        """Test get raw data"""
        return self.run_test(
            "Get Raw Data",
            "GET",
            f"api/analytics/{dashboard_id}/raw",
            200
        )

    def test_brute_force_protection(self):
        """Test brute force protection"""
        print(f"\n🔍 Testing Brute Force Protection...")
        
        # Try 6 failed login attempts
        for i in range(6):
            response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json={"email": "admin@crm.com", "password": "wrongpassword"},
                headers={'Content-Type': 'application/json'}
            )
            print(f"   Attempt {i+1}: Status {response.status_code}")
            
            if i >= 4 and response.status_code == 429:
                print("✅ Brute force protection working - account locked")
                self.tests_passed += 1
                self.tests_run += 1
                return True
        
        print("❌ Brute force protection not working properly")
        self.tests_run += 1
        return False

def main():
    print("🚀 Starting CRM API Testing...")
    print("=" * 50)
    
    tester = CRMAPITester()
    
    # Test basic connectivity
    success, _ = tester.test_health_check()
    if not success:
        print("❌ Health check failed, stopping tests")
        return 1

    # Test user registration
    success, reg_response = tester.test_user_registration()
    if not success:
        print("❌ User registration failed")

    # Test admin login
    success, login_response = tester.test_admin_login()
    if not success:
        print("❌ Admin login failed, stopping tests")
        return 1

    # Test authenticated endpoints
    tester.test_get_user_profile()
    
    # Test dashboard operations
    success, dashboard_response = tester.test_create_dashboard()
    dashboard_id = None
    if success and 'dashboard' in dashboard_response:
        dashboard_id = dashboard_response['dashboard']['_id']
        print(f"   Created dashboard ID: {dashboard_id}")
    elif success and '_id' in dashboard_response:
        dashboard_id = dashboard_response['_id']
        print(f"   Created dashboard ID: {dashboard_id}")

    tester.test_get_dashboards()
    
    if dashboard_id:
        tester.test_get_dashboard_by_id(dashboard_id)
        tester.test_update_dashboard(dashboard_id)
        
        # Test Excel operations
        success, upload_response = tester.test_excel_upload(dashboard_id)
        excel_data_id = None
        if success and 'excelDataId' in upload_response:
            excel_data_id = upload_response['excelDataId']
            print(f"   Excel data ID: {excel_data_id}")
        
        tester.test_get_excel_data(dashboard_id)
        
        if excel_data_id:
            tester.test_map_columns(excel_data_id)
        
        # Test analytics
        tester.test_get_analytics(dashboard_id)
        tester.test_get_filter_options(dashboard_id)
        tester.test_get_raw_data(dashboard_id)
        
        # Clean up - delete dashboard
        tester.test_delete_dashboard(dashboard_id)

    # Test logout
    tester.test_logout()
    
    # Test security features
    tester.test_brute_force_protection()

    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Tests completed: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())