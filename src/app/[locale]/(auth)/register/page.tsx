import { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { BetaAiNotice } from "@/components/beta-ai-notice";
import GoogleSignInButton from "../_components/google-sign-in-button";
import EmailSignUpForm from "./_components/sign-up-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.register.metadata");

  return { title: t("title"), description: t("description") };
}

export default function RegisterPage() {
  const t = useTranslations("auth.register");

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-xl font-semibold">{t("title")}</h1>
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleSignInButton />
        <EmailSignUpForm />
        <p className="text-xs text-center text-muted-foreground">
          {t.rich("consent", {
            terms: (chunks) => (
              <Link
                href="/terms"
                className="font-medium text-primary-ink underline-offset-4 hover:underline"
              >
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link
                href="/privacy"
                className="font-medium text-primary-ink underline-offset-4 hover:underline"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
        <BetaAiNotice />
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        {t("haveAccount")}&nbsp;
        <Link
          href="/login"
          className="font-medium text-primary-ink underline-offset-4 hover:underline"
        >
          {t("signIn")}
        </Link>
      </CardFooter>
    </Card>
  );
}
