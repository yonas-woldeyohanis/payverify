import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { onSyncStateChange } from "@/services/syncQueue";

/** Small persistent header indicator: "3 pending" / spinning "syncing" /
 * "All synced" — so a waiter always knows whether tonight's totals have
 * actually left the device. */
export function SyncStatusBadge() {
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => onSyncStateChange((e) => {
    setSyncing(e.syncing);
    setPendingCount(e.pendingCount);
  }), []);

  const label = syncing
    ? "Syncing..."
    : pendingCount > 0
    ? `${pendingCount} pending`
    : "All synced";

  return (
    <View style={[styles.badge, pendingCount > 0 && !syncing ? styles.badgeWarn : styles.badgeOk]}>
      {syncing && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />}
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeOk: { backgroundColor: "#1F4B3F" },
  badgeWarn: { backgroundColor: "#B8863C" },
  text: { color: "#fff", fontSize: 12, fontWeight: "600" },
});
