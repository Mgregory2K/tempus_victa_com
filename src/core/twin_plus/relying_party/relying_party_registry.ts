export type RelyingParty = {
  platform_id: string;
  display_name: string;
  allowed_scopes: string[];
  default_scope: string;
  trust_level: "verified_partner" | "external_untrusted_transport";
  supports_structured_import: boolean;
  supports_signed_passport_verification: boolean;
};

export class RelyingPartyRegistry {
  private static instance: RelyingPartyRegistry;
  private platforms: RelyingParty[] = [];

  private constructor() {
    this.platforms = [
      {
        platform_id: "claude_web",
        display_name: "Claude Web",
        allowed_scopes: ["basic_identity", "ai_chat_compact", "presentation_mode"],
        default_scope: "ai_chat_compact",
        trust_level: "external_untrusted_transport",
        supports_structured_import: false,
        supports_signed_passport_verification: false,
      },
      {
        platform_id: "gemini_web",
        display_name: "Gemini Web",
        allowed_scopes: ["basic_identity", "ai_chat_compact"],
        default_scope: "ai_chat_compact",
        trust_level: "external_untrusted_transport",
        supports_structured_import: false,
        supports_signed_passport_verification: false,
      },
    ];
  }

  public static getInstance(): RelyingPartyRegistry {
    if (!RelyingPartyRegistry.instance) {
      RelyingPartyRegistry.instance = new RelyingPartyRegistry();
    }
    return RelyingPartyRegistry.instance;
  }

  public getPlatform(id: string): RelyingParty | undefined {
    return this.platforms.find((p) => p.platform_id === id);
  }

  public getAllPlatforms(): RelyingParty[] {
    return this.platforms;
  }
}
