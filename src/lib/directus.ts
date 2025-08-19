// src/lib/directus.ts
import { createDirectus, rest, staticToken } from '@directus/sdk';

const URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://3.85.34.51:8055';
const TOKEN = process.env.DIRECTUS_STATIC_TOKEN || 'W_QMhaWBsM3lFqsnYRLeZyCfnvaIWUzl';

const client = createDirectus(URL).with(rest()).with(staticToken(TOKEN));
export default client;
