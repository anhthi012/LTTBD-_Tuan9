import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, View, FlatList } from "react-native";
import { NotificationItem } from "../components/NotificationItem";
import { EmptyState } from "../components/EmptyState";
import { LoadingView } from "../components/LoadingView";
import { ErrorView } from "../components/ErrorView";
import { getNotifications, markAsRead } from "../services/notificationService";
import { getErrorMessage } from "../api/client";
import { useAuth } from "../store/hooks";
import { RootScreenProps } from "../navigation/types";
import { AppNotification } from "../types";
import { colors } from "../theme";

export function NotificationsScreen({ navigation }: RootScreenProps<"Notifications">) {
  const { user, isLoggedIn } = useAuth();
  const [data, setData] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    // BT9.5c: Tải danh sách thông báo
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getNotifications(user.id));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const open = async (n: AppNotification) => {
    // BT9.5d: Cập nhật lạc quan và điều hướng
    if (!n.read) {
      // 1. Đổi UI ngay lập tức thành đã đọc (read: true)
      setData((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));

      // 2. Gọi API. Nếu lỗi thì hoàn lại giao diện (read: false)
      markAsRead(n.id).catch(() =>
        setData((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: false } : x)))
      );
    }

    // Điều hướng theo target
    if (n.target?.screen === "Orders") {
      navigation.navigate("Orders");
    } else if (n.target?.screen === "BookDetail" && n.target.bookId) {
      navigation.navigate("BookDetail", { bookId: n.target.bookId });
    }
  };

  if (!isLoggedIn) {
    return <EmptyState emoji="🔒" title="Bạn cần đăng nhập" actionLabel="Đăng nhập" onAction={() => navigation.navigate("Login")} />;
  }
  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={load} />;

  return (
    <View style={styles.container}>
      {/* BT9.5e: FlatList hiển thị danh sách thông báo */}
      <FlatList
        data={data}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={{ gap: 8, flexGrow: 1 }}
        renderItem={({ item }) => <NotificationItem item={item} onPress={open} />}
        ListEmptyComponent={<EmptyState emoji="📭" title="Chưa có thông báo nào" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 12
  }
});