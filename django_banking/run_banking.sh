#!/bin/bash
set -e

echo "=============================================="
echo " Apex Bank Management System - Quick Start "
echo "=============================================="

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not installed."
    exit 1
fi

echo "1. Setting up virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate

echo "2. Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "3. Copying environment file if missing..."
if [ ! -f ".env" ]; then
    cp .env.example .env
fi

echo "4. Running database migrations..."
python manage.py makemigrations accounts banking loans deposits core reports
python manage.py migrate

echo "5. Seeding demo banking data..."
python manage.py seed_banking_data

echo "=============================================="
echo " Apex Bank is starting at http://127.0.0.1:8000"
echo " Demo Logins:"
echo " - Admin:    admin / admin123"
echo " - Staff:    staff_officer / staff123"
echo " - Customer: john_doe / customer123"
echo "=============================================="

python manage.py runserver 0.0.0.0:8000
