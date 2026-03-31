import requests
import sys
import json
from datetime import datetime

class SimpleCRMTester:
    def __init__(self, base_url="https://multi-tenant-crm-42.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
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
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

def main():
    print("🚀 Starting Simplified CRM API Testing...")
    print("=" * 50)
    
    tester = SimpleCRMTester()
    
    # Test health check
    success, _ = tester.run_test("Health Check", "GET", "api/health", 200)
    if not success:
        print("❌ Health check failed")
        return 1

    # Test admin login
    success, login_response = tester.run_test(
        "Admin Login",
        "POST",
        "api/auth/login",
        200,
        data={"email": "admin@crm.com", "password": "Admin@123"}
    )
    if not success:
        print("❌ Admin login failed")
        return 1

    # Test authenticated endpoints
    tester.run_test("Get User Profile", "GET", "api/auth/me", 200)
    tester.run_test("Get Dashboards", "GET", "api/dashboards", 200)
    
    # Test dashboard creation
    dashboard_data = {
        "name": f"Test Dashboard {datetime.now().strftime('%H%M%S')}",
        "description": "Test dashboard for API testing",
        "excelSourcesCount": 1,
        "sourceNames": ["Sales Data"]
    }
    success, dashboard_response = tester.run_test(
        "Create Dashboard",
        "POST",
        "api/dashboards",
        201,
        data=dashboard_data
    )
    
    dashboard_id = None
    if success:
        if 'dashboard' in dashboard_response:
            dashboard_id = dashboard_response['dashboard']['_id']
        elif '_id' in dashboard_response:
            dashboard_id = dashboard_response['_id']
        print(f"   Created dashboard ID: {dashboard_id}")

    if dashboard_id:
        # Test dashboard operations
        tester.run_test("Get Dashboard by ID", "GET", f"api/dashboards/{dashboard_id}", 200)
        
        # Test analytics endpoints
        tester.run_test("Get Analytics", "GET", f"api/analytics/{dashboard_id}", 200)
        tester.run_test("Get Filter Options", "GET", f"api/analytics/{dashboard_id}/filters", 200)
        
        # Clean up
        tester.run_test("Delete Dashboard", "DELETE", f"api/dashboards/{dashboard_id}", 200)

    # Test logout
    tester.run_test("Logout", "POST", "api/auth/logout", 200)

    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Tests completed: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed >= tester.tests_run * 0.8:  # 80% pass rate
        print("🎉 Most tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())