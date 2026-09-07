import { useLocalSearchParams, useRouter } from "expo-router";
import { CaptureScreen } from "../src/screens/CaptureScreen";

export default function Capture() {
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();

  return (
    <CaptureScreen
      projectId={projectId}
      onSaved={(entry) => router.replace({ pathname: "/", params: { savedEntryId: entry.id } })}
      onExit={() => router.back()}
    />
  );
}
