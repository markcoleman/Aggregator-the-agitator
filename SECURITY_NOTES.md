# Security Notes

This document tracks known security vulnerabilities and their status.

## Known Vulnerabilities

### Low Severity

#### fast-redact Prototype Pollution (CVE-2025-57319)

**Status:** Acknowledged - No patch available  
**Severity:** LOW  
**CVSS Score:** 0  
**Advisory:** [GHSA-ffrw-9mx8-89p8](https://github.com/advisories/GHSA-ffrw-9mx8-89p8)

**Description:**
A prototype pollution vulnerability exists in fast-redact version 3.5.0 and earlier. This affects the `nestedRestore` function and allows attackers to inject properties on `Object.prototype` via a crafted payload.

**Impact:**
- Minimum consequence is Denial of Service (DoS)
- Requires a specifically crafted malicious payload
- Low likelihood of exploitation in typical usage

**Dependency Path:**
```
fastify → pino → fast-redact@3.5.0
```

**Mitigation:**
- This is a transitive dependency through fastify/pino
- No patched version is currently available (patched_versions: <0.0.0)
- The vulnerability requires a crafted payload to exploit
- We monitor for updates and will upgrade when a patch is released
- Input validation and sanitization are implemented at the API layer

**Action Items:**
- [x] Vulnerability acknowledged and documented
- [x] Configured CI to allow low severity vulnerabilities
- [ ] Monitor for fast-redact updates
- [ ] Update when patch becomes available

## Security Policy

For our full security policy and how to report vulnerabilities, please see [SECURITY.md](.github/SECURITY.md) or contact the maintainers directly.

## Dependency Updates

We regularly monitor security advisories and update dependencies when patches become available. Our CI pipeline checks for moderate and higher severity vulnerabilities on every pull request.

---

*Last Updated: 2025-10-11*
