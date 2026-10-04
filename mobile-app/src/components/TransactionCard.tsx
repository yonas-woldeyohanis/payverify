import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { LocalTransaction } from "@/types";
import { formatCurrency, formatTime } from "@/utils/format";

export function TransactionCard({ tx }: { tx: LocalTransaction }) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.provider}>{tx.paymentProvider}</Text>
        <Text style={styles.amount}>{formatCurrency(tx.amount)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.meta}>Ref: {tx.referenceNumber}</Text>
        <Text style={styles.meta}>{formatTime(tx.capturedAt)}</Text>
      </View>
      <Text style={[styles.status, statusStyle(tx.syncStatus)]}>
        {statusLabel(tx.syncStatus)}
      </Text>
    </View>
  );
}

function statusLabel(status: LocalTransaction["syncStatus"]): string {
  if (status === "pending") return "Waiting to sync";
  if (status === "error") return "Sync failed — will retry";
  return "Synced";
}

function statusStyle(status: LocalTransaction["syncStatus"]) {
  if (status === "pending") return { color: "#B8863C" };
  if (status === "error") return { color: "#B5442E" };
  return { color: "#1F4B3F" };
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E7E3D9",
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  provider: { fontWeight: "700", color: "#14181F", fontSize: 15 },
  amount: { fontWeight: "700", color: "#14181F", fontSize: 15 },
  meta: { color: "#5B6472", fontSize: 12 },
  status: { fontSize: 11, fontWeight: "600", marginTop: 4 },
});
