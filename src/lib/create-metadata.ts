import { getTranslations } from "next-intl/server";

type MetadataParams = {
  params: Promise<{ lang: string }>;
};

type MetadataConfig = {
  namespace: string;
  /**
   * Skip this page's own `title` so it inherits the root layout's plain
   * `default` ("DuckTale") instead of being run through its template
   * ("DuckTale - %s") — for the homepage, which doesn't need (and
   * shouldn't get) a "DuckTale - DuckTale"-shaped title. openGraph.title is
   * skipped the same way, so it likewise inherits the root layout's.
   */
  useDefaultTitle?: boolean;
};

export function createMetadata(config: MetadataConfig) {
  return async function generateMetadata({ params }: MetadataParams) {
    const { lang: locale } = await params;

    const t = await getTranslations({
      locale,
      namespace: `Metadata.${config.namespace}`,
    });

    const title = config.useDefaultTitle ? undefined : t("title");

    return {
      ...(title !== undefined && { title }),
      description: t("description"),
      openGraph: {
        ...(title !== undefined && { title }),
        description: t("description"),
        locale: locale,
      },
    };
  };
}