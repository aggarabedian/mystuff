import { useLocalSearchParams } from "expo-router";

import { EditRoomView } from "@/components/rooms/EditRoomView";

export default function EditRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <EditRoomView key={id} roomId={id} />;
}
