import type { NextConfig } from "next";
import type { Configuration, RuleSetRule } from "webpack";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  serverActions: {
    bodySizeLimit: "5mb",
  },
  webpack: (config: Configuration) => {
    const existingRules = config.module?.rules as RuleSetRule[] | undefined;
    if (existingRules) {
      const wasmRuleIndex = existingRules.findIndex(
        (rule) => rule.test instanceof RegExp && rule.test.test(".wasm")
      );
      if (wasmRuleIndex !== -1) {
        existingRules.splice(wasmRuleIndex, 1);
      }
    }

    config.module?.rules?.push({
      test: /photon_rs_bg\.wasm$/,
      type: "asset/resource",
    });

    return config;
  },
};

export default nextConfig;