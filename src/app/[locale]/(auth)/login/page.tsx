import { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";
import GoogleSignInButton from "../_components/google-sign-in-button";
import EmailSignInForm from "./_components/sign-in-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login.metadata");

  return { title: t("title"), description: t("description") };
}

// ?error= values set by /auth/confirm and /auth/callback; their messages live in "auth.login.linkErrors".
const LINK_ERRORS = ["confirmation_failed", "google_failed"] as const;

function isLinkError(value: unknown): value is (typeof LINK_ERRORS)[number] {
  return LINK_ERRORS.some((error) => error === value);
}

export default function LoginPage({
  searchParams,
}: PageProps<"/[locale]/login">) {
  const t = useTranslations("auth.login");

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-xl font-semibold">{t("title")}</h1>
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* searchParams are request data, so with Cache Components they must be read behind a boundary. */}
        <Suspense
          fallback={
            <div className="space-y-4">
              <GoogleSignInButton />
              <EmailSignInForm />
            </div>
          }
        >
          <SignInSection searchParams={searchParams} />
        </Suspense>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        {t("noAccount")}&nbsp;
        <Link
          href="/register"
          className="font-medium text-primary-ink underline-offset-4 hover:underline"
        >
          {t("createOne")}
        </Link>
      </CardFooter>
    </Card>
  );
}

async function SignInSection({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/login">["searchParams"];
}) {
  const { next, error } = await searchParams;
  const t = await getTranslations("auth.login.linkErrors");
  const errorMessage = isLinkError(error) ? t(error) : undefined;

  return (
    <div className="space-y-4">
      {errorMessage && (
        <p
          role="alert"
          className="p-3 text-sm rounded-md bg-destructive/10 text-destructive"
        >
          {errorMessage}
        </p>
      )}
      <GoogleSignInButton next={typeof next === "string" ? next : undefined} />
      <EmailSignInForm next={typeof next === "string" ? next : undefined} />
    </div>
  );
}
