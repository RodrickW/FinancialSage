import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  type: 'alert' | 'info' | 'success';
}

// No fake notifications - using real API data only

export function NotificationDrawer() {
  const [open, setOpen] = React.useState(false);

  // Fetch real notifications from API
  const { data: insights = [] } = useQuery({
    queryKey: ['/api/insights'],
    retry: false
  });

  // Convert insights to notifications format
  const notifications: NotificationItem[] = insights.map((insight: any) => ({
    id: insight.id.toString(),
    title: insight.title,
    message: insight.description,
    date: new Date(insight.createdAt).toLocaleDateString(),
    isRead: insight.isRead,
    type: insight.severity === 'warning' ? 'alert' : insight.severity === 'success' ? 'success' : 'info'
  }));

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    // In a real implementation, you would call an API to mark as read
    // For now, this is just visual feedback
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="p-2 rounded-full hover:bg-gray-100 relative border border-gray-300">
          <span className="material-icons text-black">notifications</span>
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-black text-white border-none h-5 min-w-5 flex items-center justify-center p-0">
              {unreadCount}
            </Badge>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-xl">Notifications</SheetTitle>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
            </p>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={markAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </div>
        </SheetHeader>
        <Separator className="my-4" />
        
        <Tabs defaultValue="all" className="mt-2">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <NotificationList 
              notifications={notifications} 
              markAsRead={markAsRead}
            />
          </TabsContent>
          
          <TabsContent value="unread">
            <NotificationList 
              notifications={notifications.filter(n => !n.isRead)} 
              markAsRead={markAsRead}
            />
          </TabsContent>
          
          <TabsContent value="alerts">
            <NotificationList 
              notifications={notifications.filter(n => n.type === 'alert')} 
              markAsRead={markAsRead}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

interface NotificationListProps {
  notifications: NotificationItem[];
  markAsRead: (id: string) => void;
}

function NotificationList({ notifications, markAsRead }: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <span className="material-icons text-4xl text-muted-foreground mb-2">notifications_off</span>
        <p className="text-muted-foreground">No notifications to display</p>
      </div>
    );
  }
  
  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'alert': return <span className="material-icons text-red-500">warning</span>;
      case 'success': return <span className="material-icons text-primary">check_circle</span>;
      default: return <span className="material-icons text-emerald-500">info</span>;
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-4 pr-3">
        {notifications.map((notification) => (
          <div 
            key={notification.id}
            className={`p-4 rounded-lg border ${!notification.isRead ? 'bg-muted/30 border-muted-foreground/20' : 'bg-background border-input'}`}
            onClick={() => markAsRead(notification.id)}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {notification.title}
                  </h4>
                  <span className="text-xs text-muted-foreground">{notification.date}</span>
                </div>
                <p className="text-sm mt-1 text-muted-foreground">{notification.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}