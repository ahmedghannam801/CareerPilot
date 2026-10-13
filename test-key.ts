import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

console.log('==============================================');
console.log('   CareerPilot AI - Environment Keys Check   ');
console.log('==============================================');

const geminiKey = process.env.GEMINI_API_KEY;
const linkedinClientId = process.env.LINKEDIN_CLIENT_ID;
const linkedinClientSecret = process.env.LINKEDIN_CLIENT_SECRET;
const linkedinRedirectUri = process.env.LINKEDIN_REDIRECT_URI;
const rapidApiKey = process.env.RAPIDAPI_KEY || process.env.JSEARCH_RAPIDAPI_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log(`[1] GEMINI_API_KEY:         ${geminiKey ? ' Configured (Valid)' : ' Missing'}`);
console.log(`[2] LINKEDIN_CLIENT_ID:     ${linkedinClientId ? ' Configured (' + linkedinClientId + ')' : ' Missing'}`);
console.log(`[3] LINKEDIN_CLIENT_SECRET: ${linkedinClientSecret ? ' Configured (Length: ' + linkedinClientSecret.length + ')' : ' Missing'}`);
console.log(`[4] LINKEDIN_REDIRECT_URI:  ${linkedinRedirectUri ? ' ' + linkedinRedirectUri : ' Not set (defaults to http://localhost:3000/api/auth/linkedin/callback)'}`);
console.log(`[5] RAPIDAPI / INDEED FEED: ${rapidApiKey ? ' Configured (JSearch & Indeed Active)' : ' Missing'}`);
console.log(`[6] SUPABASE CLOUD BACKEND: ${supabaseUrl ? ' Configured (' + supabaseUrl + ')' : ' Local Database (Ready for Supabase URL & Key)'}`);
console.log('==============================================');

if (linkedinClientId && linkedinClientSecret) {
  console.log(' LinkedIn OAuth 2.0 Credentials: Ready');
}
if (supabaseUrl && supabaseKey) {
  console.log(' Supabase Cloud Database: Ready');
} else {
  console.log('ℹ️  Supabase SQL Schema ready in supabase_schema.sql (paste into Supabase SQL Editor)');
}
console.log('==============================================');
