# Changelog

All notable changes to the SP-API Dev MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of SP-API Dev MCP Server
- Orders API v2026-01-01 support
  - Search orders with filters
  - Get order details with includedData parameter
  - Cancel orders
- Orders API v0 support (for operations not yet available in v1)
  - Update shipment status
  - Update verification status
  - Confirm shipment
  - Get regulated order info
- Migration Assistant tool
  - Analyze code for migration from Orders API v0 to v2026-01-01
  - Generate refactored code
  - Provide general migration guidance
- Comprehensive test suite with 62 tests
- TypeScript support with declaration files
- Environment variable configuration
- Detailed README with examples

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

## [0.0.1] - YYYY-MM-DD

### Added
- Initial development version

[Unreleased]: https://github.com/amzn/selling-partner-api-samples/compare/mcp-server-v0.0.1...HEAD
[0.0.1]: https://github.com/amzn/selling-partner-api-samples/releases/tag/mcp-server-v0.0.1
