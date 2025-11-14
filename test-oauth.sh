#!/bin/bash
# OAuth2 Test Script - Quick Verification

echo "🔍 OAuth2 Configuration Check"
echo "================================"

# Check .env file
echo ""
echo "📋 Environment Variables:"
if [ -f ".env" ]; then
  echo "✅ .env file found"
  echo "   FRONTEND_URL: $(grep FRONTEND_URL .env | cut -d '=' -f 2)"
  echo "   GOOGLE_CLIENT_ID: $(grep GOOGLE_CLIENT_ID .env | cut -d '=' -f 2 | head -c 20)..."
  echo "   GOOGLE_REDIRECT_URI: $(grep GOOGLE_REDIRECT_URI .env | cut -d '=' -f 2)"
  echo "   REDIS_URL: $(grep REDIS_URL .env | cut -d '=' -f 2 | head -c 30)..."
else
  echo "❌ .env file not found"
fi

# Check if backend is running
echo ""
echo "🚀 Backend Status:"
if curl -s http://localhost:3000/api/health | grep -q "ok"; then
  echo "✅ Backend is running on port 3000"
else
  echo "❌ Backend is NOT running on port 3000"
  echo "   Run: npm start"
fi

# Check if frontend is running
echo ""
echo "🎨 Frontend Status:"
if curl -s http://localhost:4200 >/dev/null 2>&1; then
  echo "✅ Frontend is running on port 4200"
else
  echo "❌ Frontend is NOT running on port 4200"
  echo "   Run: cd eventhub-frontend && ng serve"
fi

# Check Redis
echo ""
echo "📦 Redis Status:"
if redis-cli ping >/dev/null 2>&1; then
  echo "✅ Redis is running"
  redis_info=$(redis-cli info stats 2>/dev/null | grep connected_clients)
  echo "   $redis_info"
else
  echo "❌ Redis is NOT running"
  echo "   Check REDIS_URL: $(grep REDIS_URL .env | cut -d '=' -f 2)"
fi

# Check auth routes
echo ""
echo "🔐 Auth Routes:"
echo "   GET  /api/auth/google"
echo "   GET  /api/auth/google/callback"
echo "   GET  /api/auth/google/success"
echo "   GET  /api/auth/oauth-data/{sessionId}"
echo "   GET  /api/auth/google/failure"

echo ""
echo "✨ Ready to test! Visit: http://localhost:4200/login"
echo ""
