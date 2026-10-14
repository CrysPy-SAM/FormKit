// ~/components/auth/google-signin-button.tsx
"use client";

import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { setActiveOrgIdClient } from "~/lib/org-cookie";

export const isGoogleAuthEnabled = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export function GoogleSignInButton() {
    const router = useRouter();
    const utils = trpc.useUtils();

    const googleSignIn = trpc.auth.googleSignIn.useMutation({
        onSuccess: (data) => {
            const defaultOrg = data.orgs[0];
            if (defaultOrg) setActiveOrgIdClient(defaultOrg.id);
            utils.invalidate(); // clear any cached "unauthenticated" state on user/session queries
            router.push("/dashboard");
        },
        onError: (err) => {
            toast.error(err.message || "Google sign-in failed");
        },
    });

    function handleSuccess(credentialResponse: CredentialResponse) {
        if (!credentialResponse.credential) {
            toast.error("No credential returned from Google");
            return;
        }
        // credentialResponse.credential IS the ID token — the exact string
        // your backend's verifyGoogleIdToken() expects
        googleSignIn.mutate({ idToken: credentialResponse.credential });
    }

    if (!isGoogleAuthEnabled) return null;

    return (
        <div className="flex justify-center [&>div]:w-full">
            <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => toast.error("Google login popup failed")}
                useOneTap={false}
                width="100%"
                theme="outline"
                shape="pill"
            />
        </div>
    );
}