import React, { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { getWaiterTransactions } from "@/db/localLedger";
import { TransactionCard } from "@/components/TransactionCard";
import type { LocalTransaction } from "@/types";

export function HistoryScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<LocalTransaction[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        getWaiterTransactions(user.id).then(setTransactions);
      }
    }, [user])
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      data={transactions}
      keyExtractor={(item) => item.localId}
      renderItem={({ item }) => <TransactionCard tx={item} />}
      ListEmptyComponent={
        <View style={styles.emptyStateContainer}>
          <Ionicons name="receipt-outline" size={48} color="#2A323D" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>No transactions scanned yet.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#14181F" },
  center: { flex: 1, backgroundColor: "#14181F", justifyContent: "center", alignItems: "center", padding: 20 },
  emptyStateContainer: { alignItems: "center", marginTop: 60 },
  emptyTitle: { color: "#fff", fontSize: 20, fontWeight: "600", marginBottom: 8 },
  emptyText: { color: "#9AA3AF", textAlign: "center", fontSize: 16 },
});
