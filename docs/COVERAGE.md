# 📊 Test Coverage Report

## Current Coverage Status

| Metric | Coverage | Status |
|--------|----------|--------|
| **Statements** | 32.8% | 🟡 |
| **Branches** | 20.92% | 🔴 |
| **Functions** | 25.8% | 🔴 |
| **Lines** | 33.18% | 🟡 |

## How to Generate Coverage Report

```bash
# Run tests with coverage
npm run test:coverage

# Open HTML report in browser
start coverage/lcov-report/index.html  # Windows
open coverage/lcov-report/index.html   # macOS
xdg-open coverage/lcov-report/index.html  # Linux
```

## Coverage by Module

### ✅ Well Covered (>80%)
- `src/middlewares/auth.middleware.js` - **100%** 🎯
- `src/models/` (User, Event, Registration) - **100%** 🎯
- `src/routes/` (All route files) - **97.95%** ✅
- `src/app.js` - **88.23%** ✅
- `src/controllers/registration.controller.js` - **82.05%** ✅

### 🟡 Partially Covered (40-80%)
- `src/controllers/event.controller.js` - **57.62%**
- `src/controllers/auth.controller.js` - **47.54%**
- `src/services/event.service.js` - **77.08%**
- `src/middlewares/role.middleware.js` - **70%**

### 🔴 Needs Coverage (<40%)
- `src/controllers/chat.controller.js` - **0%** ❌
- `src/controllers/report.controller.js` - **0%** ❌
- `src/controllers/user.controller.js` - **0%** ❌
- `src/services/chat.service.js` - **0%** ❌
- `src/services/report.service.js` - **0%** ❌
- `src/config/socket.js` - **5.88%** ❌
- `src/config/mongodb.js` - **0%** ❌
- `src/config/redis.js` - **5.88%** ❌
- `src/config/email.js` - **13.79%** ❌

## Coverage Improvement Plan

### Phase 1: Core Features (Priority: High)
- [ ] Add tests for `chat.controller.js` and `chat.service.js`
- [ ] Add tests for `report.controller.js` and `report.service.js`
- [ ] Add tests for `user.controller.js`
- [ ] Improve `auth.controller.js` coverage (forgot-password, reset-password flows)

### Phase 2: Infrastructure (Priority: Medium)
- [ ] Test Socket.IO integration (`socket.js`)
- [ ] Test Redis integration (`redis.js`)
- [ ] Test MongoDB integration (`mongodb.js`)
- [ ] Test Email service (`email.js`)

### Phase 3: Edge Cases (Priority: Low)
- [ ] Test error handlers in `event.controller.js`
- [ ] Test remaining branches in `rateLimiter.middleware.js`
- [ ] Test validation edge cases

## Target Coverage Goals

| Metric | Current | Target (3 months) | Target (6 months) |
|--------|---------|-------------------|-------------------|
| Statements | 32.8% | 60% | 80% |
| Branches | 20.92% | 50% | 70% |
| Functions | 25.8% | 55% | 75% |
| Lines | 33.18% | 60% | 80% |

## Coverage Reports Location

- **HTML Report**: `coverage/lcov-report/index.html`
- **LCOV Report**: `coverage/lcov.info`
- **JSON Report**: `coverage/coverage-final.json`
- **Text Summary**: Console output after running tests

## CI/CD Integration

The coverage report can be integrated with:
- **Codecov**: Upload `coverage/lcov.info`
- **Coveralls**: Upload `coverage/lcov.info`
- **GitHub Actions**: Display in PR comments
- **SonarQube**: Import LCOV report

## Notes

- Coverage directory is gitignored
- Coverage threshold configured in `package.json`
- Tests are excluded from coverage calculation
- Config files (swagger) are excluded from coverage
