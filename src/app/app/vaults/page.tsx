import { listAppVaults, toApplicationError } from "@/modules/application";
import {
  PageContainer,
  PageHeader,
  Stack,
  ErrorState,
  getErrorPresentation,
  translate,
} from "../../components/ui-next";
import { getAppRequestContext } from "../_lib/request-context";
import { VaultList, VaultRetry } from "./_components/vault-list";

export default async function VaultsPage() {
  const { actor, application } = await getAppRequestContext();
  const locale = application.locale;
  let content;
  try {
    content = <VaultList vaults={await listAppVaults(actor)} locale={locale} />;
  } catch (error) {
    const copy = getErrorPresentation(toApplicationError(error).error);
    content = (
      <ErrorState
        title={translate(locale, copy.titleKey)}
        description={translate(locale, copy.descriptionKey)}
        action={<VaultRetry locale={locale} />}
      />
    );
  }
  return (
    <PageContainer>
      <Stack>
        <PageHeader
          title={translate(locale, "vault.title")}
          description={translate(locale, "vault.description")}
        />
        {content}
      </Stack>
    </PageContainer>
  );
}
