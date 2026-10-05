/**
 * Multi-tenant subdomain resolution utility
 */

export const getTenantSubdomain = (hostname = typeof window !== 'undefined' ? window.location.hostname : '') => {
  if (!hostname) return null;

  // Check URL query param first (for easy local testing without DNS, e.g. ?org=sushihan or ?org=sh)
  if (typeof window !== 'undefined' && window.location.search) {
    const params = new URLSearchParams(window.location.search);
    const orgQuery = params.get('org');
    if (orgQuery) return orgQuery.toLowerCase();
  }

  const parts = hostname.toLowerCase().split('.');

  // Production: [subdomain].smr.onl
  if (parts.length >= 3 && parts[parts.length - 2] === 'smr' && parts[parts.length - 1] === 'onl') {
    const sub = parts[0];
    if (sub !== 'www' && sub !== 'api') return sub;
    return null;
  }

  // Local development: [subdomain].localhost (e.g. sushihan.localhost:3004)
  if (parts.length >= 2 && parts[parts.length - 1] === 'localhost') {
    const sub = parts[0];
    if (sub !== 'www' && sub !== 'api') return sub;
    return null;
  }

  return null;
};

export const getTenantOrgId = () => {
  const sub = getTenantSubdomain();
  if (!sub) return null;
  const clean = sub.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean === 'sushihan' || clean === 'sh') return 'sh';
  if (clean === 'sushimaster' || clean === 'sm') return 'default_sushimaster';
  try {
    const cached = localStorage.getItem(`tenant_org_id_${clean}`);
    if (cached) return cached;
  } catch (e) {}
  return clean;
};

export const isTenantPortalMode = () => {
  const orgId = getTenantOrgId();
  return Boolean(orgId && orgId !== 'default_sushimaster');
};

/**
 * Match a subdomain string (e.g. 'sushihan' or 'sh') to an organization object
 */
export const resolveOrganizationBySubdomain = (subdomain, organizations = []) => {
  if (!subdomain) return null;
  const clean = subdomain.toLowerCase().replace(/[^a-z0-9]/g, '');

  return organizations.find(org => {
    const orgId = (org.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const orgName = (org.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return orgId === clean || orgName === clean || orgName.includes(clean) || clean.includes(orgName);
  }) || null;
};
