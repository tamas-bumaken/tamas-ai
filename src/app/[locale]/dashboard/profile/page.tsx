import { Metadata } from "next";
import { Suspense } from "react";
import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { getAdvisorMode } from "@/actions/advisor/actions";
import { getCurrentProfile } from "@/lib/auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import AdvisorDataSetting from "./_components/advisor-data-setting";
import BusinessProfileCardForm from "./_components/business-profile-form";
import DeleteAccountDialog from "./_components/delete-account-dialog";
import ProfileDetailsForm from "./_components/profile-form";
import SignOutButton from "./_components/sign-out-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profile.metadata");

  return { title: t("title"), description: t("description") };
}

function FormSkeleton({ label, rows }: { label: string; rows: number }) {
  return (
    <div aria-busy="true" aria-label={label} className="space-y-4">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton
          key={index}
          className="w-full h-9 motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tLanguage = useTranslations("language");

  return (
    <div className="max-w-2xl p-2 space-y-6">
      <section id="header">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("account.title")}</h2>
          </CardTitle>
          <CardDescription>{t("account.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={<FormSkeleton label={t("account.loading")} rows={2} />}
          >
            <AccountSection />
          </Suspense>
        </CardContent>
      </Card>
      {/* Linked from the privacy note in the Advisor drawer. */}
      <Card id="advisor-data" className="scroll-mt-4">
        <CardHeader>
          <CardTitle>
            <h2>{t("advisorData.title")}</h2>
          </CardTitle>
          <CardDescription>{t("advisorData.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <FormSkeleton label={t("advisorData.loading")} rows={1} />
            }
          >
            <AdvisorDataSection />
          </Suspense>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("businessProfile.title")}</h2>
          </CardTitle>
          <CardDescription>{t("businessProfile.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <FormSkeleton label={t("businessProfile.loading")} rows={4} />
            }
          >
            <BusinessProfileSection />
          </Suspense>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{tLanguage("title")}</h2>
          </CardTitle>
          <CardDescription>{tLanguage("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LanguageSwitcher />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("data.title")}</h2>
          </CardTitle>
          <CardDescription>{t("data.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* A plain link: the browser handles the file download, no client JavaScript needed. */}
          <Button asChild variant="outline">
            <a href="/api/export/transactions" download>
              <DownloadIcon aria-hidden="true" />
              {t("data.export")}
            </a>
          </Button>
        </CardContent>
      </Card>
      {/* Desktop signs out from the sidebar account menu. */}
      <Card className="md:hidden">
        <CardHeader>
          <CardTitle>
            <h2>{t("signOut.title")}</h2>
          </CardTitle>
          <CardDescription>{t("signOut.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <SignOutButton />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("deleteAccount.title")}</h2>
          </CardTitle>
          <CardDescription>{t("deleteAccount.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountDialog />
        </CardContent>
      </Card>
    </div>
  );
}

async function AccountSection() {
  const profile = await getCurrentProfile();

  return <ProfileDetailsForm profile={profile} />;
}

async function BusinessProfileSection() {
  const profile = await getCurrentProfile();

  return <BusinessProfileCardForm profile={profile} />;
}

async function AdvisorDataSection() {
  const mode = await getAdvisorMode();

  return <AdvisorDataSetting enabled={mode === "personal"} />;
}
