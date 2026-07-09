"use client";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/redux/store";
import VoiceAssistant from "@/components/VoiceAssistant";

export default function VoiceAssistantClientWrapper() {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <VoiceAssistant userId={user.id} userName={user.first_name} />
  );
}
