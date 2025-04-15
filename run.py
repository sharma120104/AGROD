from app import app

if __name__ == "__main__":
    print("AGROD - Agricultural Growth and Remote Observation Drone")
    print("Starting development server...")
    print("Access the application at http://localhost:5000")
    app.run(debug=True, host="0.0.0.0", port=5000)