import { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";
import ForgotPasswordForm from "./_components/forgot-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.forgotPassword.metadata");

  return { title: t("title"), description: t("description") };
}

export default function ForgotPasswordPage({
  searchParams,
}: PageProps<"/[locale]/forgot-password">) {
  const t = useTranslations("auth.forgotPassword");

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-xl font-semibold">{t("title")}</h1>
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* searchParams are request data, so with Cache Components they must be read behind a boundary. */}
        <Suspense>
          <LinkError searchParams={searchParams} />
        </Suspense>
        <ForgotPasswordForm />
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        {t("remembered")}&nbsp;
        <Link
          href="/login"
          className="font-medium text-primary-ink underline-offset-4 hover:underline"
        >
          {t("backToSignIn")}
        </Link>
      </CardFooter>
    </Card>
  );
}

async function LinkError({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/forgot-password">["searchParams"];
}) {
  const { error } = await searchParams;
  // Covers used and expired links, and default-template links opened in another browser (no PKCE cookie there).
  if (error !== "link_expired") return null;

  const t = await getTranslations("auth.forgotPassword");

  return (
    <p
      role="alert"
      className="p-3 text-sm rounded-md bg-destructive/10 text-destructive"
    >
      {t("linkExpired")}
    </p>
  );
}
