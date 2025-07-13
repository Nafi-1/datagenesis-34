import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Activity, Brain, Database, Zap, CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { cn } from '../lib/utils';

interface ActivityLog {
  id: string;
  timestamp: Date;
  type: 'ai_generation' | 'agent_activity' | 'data_processing' | 'system_event';
  status: 'started' | 'in_progress' | 'completed' | 'error';
  message: string;
  metadata?: Record<string, any>;
  duration?: number;
}

interface RealTimeActivityLoggerProps {
  className?: string;
  maxLogs?: number;
}

export const RealTimeActivityLogger: React.FC<RealTimeActivityLoggerProps> = ({ 
  className, 
  maxLogs = 100 
}) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const { isConnected } = useWebSocket('activity-logger');

  useEffect(() => {
    // Subscribe to activity updates
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'activity_log') {
          const newActivity: ActivityLog = {
            id: data.id || Date.now().toString(),
            timestamp: new Date(data.timestamp || Date.now()),
            type: data.activityType || 'system_event',
            status: data.status || 'started',
            message: data.message || 'Activity logged',
            metadata: data.metadata || {},
            duration: data.duration
          };

          setActivities(prev => {
            const updated = [newActivity, ...prev];
            return updated.slice(0, maxLogs);
          });
        }
      } catch (error) {
        console.warn('Failed to parse activity log message:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [maxLogs]);

  // Mock real-time updates for demo
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every 3 seconds
        const mockActivities: Partial<ActivityLog>[] = [
          {
            type: 'ai_generation',
            status: 'completed',
            message: 'Schema generation completed successfully',
            metadata: { fields: 8, domain: 'healthcare' },
            duration: 2.3
          },
          {
            type: 'agent_activity',
            status: 'in_progress',
            message: 'Data quality agent analyzing patterns',
            metadata: { records: 150 }
          },
          {
            type: 'data_processing',
            status: 'completed',
            message: 'Synthetic data batch processed',
            metadata: { rows: 500, format: 'CSV' },
            duration: 1.8
          },
          {
            type: 'system_event',
            status: 'completed',
            message: 'Model configuration updated',
            metadata: { provider: 'ollama', model: 'phi3:mini' }
          }
        ];

        const randomActivity = mockActivities[Math.floor(Math.random() * mockActivities.length)];
        const newActivity: ActivityLog = {
          id: Date.now().toString(),
          timestamp: new Date(),
          type: randomActivity.type!,
          status: randomActivity.status!,
          message: randomActivity.message!,
          metadata: randomActivity.metadata,
          duration: randomActivity.duration
        };

        setActivities(prev => [newActivity, ...prev.slice(0, maxLogs - 1)]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [maxLogs]);

  const getIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'ai_generation': return <Brain className="h-4 w-4" />;
      case 'agent_activity': return <Zap className="h-4 w-4" />;
      case 'data_processing': return <Database className="h-4 w-4" />;
      case 'system_event': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: ActivityLog['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3 text-success" />;
      case 'error': return <XCircle className="h-3 w-3 text-destructive" />;
      case 'in_progress': return <Clock className="h-3 w-3 text-warning animate-spin" />;
      default: return <AlertCircle className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: ActivityLog['status']) => {
    switch (status) {
      case 'completed': return 'success';
      case 'error': return 'destructive';
      case 'in_progress': return 'warning';
      default: return 'secondary';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    return duration < 1 ? `${(duration * 1000).toFixed(0)}ms` : `${duration.toFixed(1)}s`;
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          Real-Time Activity Log
          <Badge variant={isConnected ? "default" : "secondary"} className="ml-auto">
            {isConnected ? 'Live' : 'Offline'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No activity logged yet</p>
                <p className="text-sm">AI operations will appear here in real-time</p>
              </div>
            ) : (
              activities.map((activity, index) => (
                <div key={activity.id} className="relative">
                  <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {getIcon(activity.type)}
                      {getStatusIcon(activity.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">
                          {activity.message}
                        </p>
        <Badge variant={getStatusColor(activity.status) === 'success' ? 'default' : getStatusColor(activity.status) as 'secondary' | 'destructive'} className="text-xs">
          {activity.status.replace('_', ' ')}
        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{activity.timestamp.toLocaleTimeString()}</span>
                        <span className="capitalize">{activity.type.replace('_', ' ')}</span>
                        {activity.duration && (
                          <span className="text-success">{formatDuration(activity.duration)}</span>
                        )}
                      </div>
                      
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {Object.entries(activity.metadata).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {index < activities.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};