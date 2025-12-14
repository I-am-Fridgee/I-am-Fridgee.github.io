import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Coins, Trash2, RefreshCw, Users } from "lucide-react";

export default function AdminPanel() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [coinAmount, setCoinAmount] = useState(1000);
  const [message, setMessage] = useState("");

  // Admin queries
  const checkAdminQuery = trpc.admin.checkAdmin.useQuery();
  const allUsersQuery = trpc.admin.getAllUsers.useQuery(undefined, {
    enabled: isAdmin,
  });

  // Admin mutations
  const giveCoinsMutation = trpc.admin.giveCoins.useMutation();
  const removeFromLeaderboardMutation = trpc.admin.removeFromLeaderboard.useMutation();
  const resetUserDataMutation = trpc.admin.resetUserData.useMutation();
  const updateUserRoleMutation = trpc.admin.updateUserRole.useMutation();

  // Check if user is admin on mount
  useEffect(() => {
    if (user && checkAdminQuery.data) {
      setIsAdmin(checkAdminQuery.data);
    }
  }, [user, checkAdminQuery.data]);

  if (!user) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              You must be logged in to access the admin panel.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Admin Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              You do not have admin privileges. Only administrators can access this panel.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const handleGiveCoins = async () => {
    if (!selectedUserId || !coinAmount) {
      setMessage("Please enter a user ID and amount");
      return;
    }

    try {
      await giveCoinsMutation.mutateAsync({
        userId: parseInt(selectedUserId),
        amount: coinAmount,
      });
      setMessage(`Successfully gave ${coinAmount} coins to user ${selectedUserId}`);
      setSelectedUserId("");
      setCoinAmount(1000);
    } catch (error) {
      setMessage("Failed to give coins: " + (error as Error).message);
    }
  };

  const handleRemoveFromLeaderboard = async () => {
    if (!selectedUserId) {
      setMessage("Please enter a user ID");
      return;
    }

    try {
      await removeFromLeaderboardMutation.mutateAsync({
        userId: parseInt(selectedUserId),
      });
      setMessage(`Removed user ${selectedUserId} from leaderboard`);
      setSelectedUserId("");
    } catch (error) {
      setMessage("Failed to remove from leaderboard: " + (error as Error).message);
    }
  };

  const handleResetUserData = async () => {
    if (!selectedUserId) {
      setMessage("Please enter a user ID");
      return;
    }

    try {
      await resetUserDataMutation.mutateAsync({
        userId: parseInt(selectedUserId),
      });
      setMessage(`Reset all data for user ${selectedUserId}`);
      setSelectedUserId("");
    } catch (error) {
      setMessage("Failed to reset user data: " + (error as Error).message);
    }
  };

  const handleUpdateRole = async (userId: number, role: "user" | "admin" | "moderator") => {
    try {
      await updateUserRoleMutation.mutateAsync({ userId, role });
      setMessage(`Updated user ${userId} role to ${role}`);
      allUsersQuery.refetch();
    } catch (error) {
      setMessage("Failed to update role: " + (error as Error).message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="border-red-500">
        <CardHeader className="bg-red-950/20">
          <CardTitle className="flex items-center gap-2 text-red-300">
            <Shield className="w-6 h-6" />
            Administrator Control Panel
          </CardTitle>
        </CardHeader>
      </Card>

      {message && (
        <Alert variant={message.includes("Success") ? "default" : "destructive"}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                type="number"
                placeholder="Enter User ID"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coinAmount">Coin Amount</Label>
              <Input
                id="coinAmount"
                type="number"
                placeholder="Enter coin amount"
                value={coinAmount}
                onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button
                onClick={handleGiveCoins}
                className="bg-green-600 hover:bg-green-700"
                disabled={giveCoinsMutation.isLoading}
              >
                <Coins className="w-4 h-4 mr-2" />
                Give Coins
              </Button>

              <Button
                onClick={handleRemoveFromLeaderboard}
                variant="destructive"
                disabled={removeFromLeaderboardMutation.isLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove from Leaderboard
              </Button>

              <Button
                onClick={handleResetUserData}
                variant="destructive"
                disabled={resetUserDataMutation.isLoading}
                className="md:col-span-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset All User Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* All Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              All Users ({allUsersQuery.data?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allUsersQuery.isLoading ? (
              <div className="text-center py-4">Loading users...</div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {allUsersQuery.data?.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 border border-gray-700"
                  >
                    <div>
                      <p className="font-medium">
                        {user.name || `User ${user.id}`}
                      </p>
                      <p className="text-sm text-gray-400">
                        ID: {user.id} • {user.role} • Joined:{" "}
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleUpdateRole(
                            user.id,
                            e.target.value as "user" | "admin" | "moderator"
                          )
                        }
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                      >
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedUserId(user.id.toString())}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
