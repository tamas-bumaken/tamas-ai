import { renderSplashScreen, SPLASH_SCREENS } from "../../_lib/app-icon";

// iOS launch screens for the installed app, prerendered at build time; linked from the root layout's metadata.
export function generateStaticParams() {
  return SPLASH_SCREENS.map(({ id }) => ({ id }));
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/splash/[id]">,
) {
  const { id } = await params;
  const screen = SPLASH_SCREENS.find((candidate) => candidate.id === id);

  if (!screen) return new Response(null, { status: 404 });

  return renderSplashScreen(screen);
}
