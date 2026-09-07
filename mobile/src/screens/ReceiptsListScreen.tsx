import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useApiClient } from "../api/ApiClientProvider";
import { EmptyState } from "../components/EmptyState";
import { EntryRow } from "../components/EntryRow";
import { ErrorState } from "../components/ErrorState";
import { PrimaryButton } from "../components/PrimaryButton";
import { SkeletonRow } from "../components/SkeletonRow";
import { Toast } from "../components/Toast";
import { colors } from "../theme/colors";
import { spacing, typography } from "../theme/tokens";

const ENTRIES_PAGE_LIMIT = 20;
const SKELETON_ROW_COUNT = 6;

export function ReceiptsListScreen() {
  const api = useApiClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { savedEntryId } = useLocalSearchParams<{ savedEntryId?: string }>();
  const [toastVisible, setToastVisible] = useState(false);
  const handledSavedEntryId = useRef<string | undefined>(undefined);

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.listProjects(),
  });
  const receiptsProject = projectsQuery.data?.find((project) => project.projectType === "receipts");

  const entriesQuery = useQuery({
    queryKey: ["projectEntries", receiptsProject?.id],
    queryFn: () => api.listProjectEntries(receiptsProject!.id, { limit: ENTRIES_PAGE_LIMIT }),
    enabled: receiptsProject != null,
  });

  // AC-1 + AC-2 (KAN-5): a capture that just saved refreshes the list so the new entry appears at
  // the top labelled "Not read yet", and shows the confirmation toast once per save.
  useEffect(() => {
    if (savedEntryId != null && savedEntryId !== handledSavedEntryId.current && receiptsProject != null) {
      handledSavedEntryId.current = savedEntryId;
      setToastVisible(true);
      queryClient.invalidateQueries({ queryKey: ["projectEntries", receiptsProject.id] });
    }
  }, [savedEntryId, receiptsProject, queryClient]);

  const isLoading = projectsQuery.isLoading || (receiptsProject != null && entriesQuery.isLoading);
  const isError = projectsQuery.isError || entriesQuery.isError;
  const isRefreshing = !isLoading && (projectsQuery.isRefetching || entriesQuery.isRefetching);

  const onRetry = useCallback(() => {
    projectsQuery.refetch();
    if (receiptsProject != null) {
      entriesQuery.refetch();
    }
  }, [projectsQuery, entriesQuery, receiptsProject]);

  const onCapture = useCallback(() => {
    if (receiptsProject != null) {
      router.push({ pathname: "/capture", params: { projectId: receiptsProject.id } });
    }
  }, [router, receiptsProject]);

  const entries = entriesQuery.data?.items ?? [];
  const showFooter = !isLoading && !isError;

  return (
    <View style={styles.screen}>
      <Header entryCount={!isLoading && !isError ? entries.length : undefined} />
      {isLoading ? (
        <View testID="loading-state">
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
            <SkeletonRow key={index} />
          ))}
        </View>
      ) : isError ? (
        <ErrorState onRetry={onRetry} />
      ) : entries.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(entry) => entry.id}
          renderItem={({ item }) => <EntryRow entry={item} />}
          refreshControl={
            // Deviation from DESIGN-SYSTEM.md §5's Refresh spinner primitive (a custom 20px
            // accent ring), raised on KAN-4 rather than resolved silently: the OS-native pull
            // gesture and indicator are the platform-idiomatic affordance and get the accent
            // colour right, but their appearance isn't fully controllable to match the spec on
            // either platform. Needs an explicit call from design/owner, not an engineering one.
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRetry}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        />
      )}
      {showFooter && (
        <View style={styles.footer}>
          {toastVisible && <Toast message="Receipt saved" onDismiss={() => setToastVisible(false)} />}
          <PrimaryButton label="Capture receipt" onPress={onCapture} disabled={receiptsProject == null} />
        </View>
      )}
    </View>
  );
}

function Header({ entryCount }: { entryCount?: number }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Receipts</Text>
      {entryCount != null && (
        <Text style={styles.count}>
          {entryCount} {entryCount === 1 ? "receipt" : "receipts"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.display.fontSize,
    lineHeight: typography.display.lineHeight,
    fontWeight: typography.display.fontWeight,
    letterSpacing: typography.display.letterSpacing,
    color: colors.ink,
  },
  count: {
    fontSize: typography.label.fontSize,
    color: colors.inkMuted,
    fontVariant: ["tabular-nums"],
  },
  footer: {
    position: "relative",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
