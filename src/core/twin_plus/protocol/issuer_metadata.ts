import { KeyRegistry } from "../crypto/key_registry";

export type TwinIssuerMetadata = {
  issuer: string;
  protocol: "twin_passport";
  versions_supported: string[];
  algorithms_supported: string[];
  jwks_uri: string;
  spec_uri: string;
  revocation_endpoint: string;
  grant_endpoint: string;
};

export function getIssuerMetadata(): TwinIssuerMetadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3010";

  return {
    issuer: process.env.TWIN_ISSUER || "tempus_victa",
    protocol: "twin_passport",
    versions_supported: ["v1", "v2"],
    algorithms_supported: ["Ed25519", "HS256"],
    jwks_uri: `${baseUrl}/api/.well-known/twin-keys`,
    spec_uri: `${baseUrl}/api/.well-known/twin-spec`,
    revocation_endpoint: `${baseUrl}/api/twin/revoke`,
    grant_endpoint: `${baseUrl}/api/twin/grants`,
  };
}
