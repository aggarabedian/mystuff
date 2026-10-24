import { useLocalSearchParams } from "expo-router";

import { RoomDetailView } from "@/components/rooms/RoomDetailView";

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <RoomDetailView key={id} roomId={id} />;
}
