import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">Krafton Playground Console</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server";
              await signIn("microsoft-entra-id");
            }}
          >
            <Button type="submit" className="w-full">
              Sign in with Microsoft
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
