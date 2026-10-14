declare module "next-pwa" {
  import type { NextConfig } from "next";

  type PwaOptions = {
    dest: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    exclude?: RegExp[];
  };

  export default function withPwa(options: PwaOptions): (config: NextConfig) => NextConfig;
}
