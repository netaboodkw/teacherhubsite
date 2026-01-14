import { useState } from 'react';
import { Bell, BellOff, Volume2, VolumeX, Vibrate, Clock, Smartphone, Play, Music, Repeat, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ReminderSettings } from '@/hooks/usePeriodReminder';
import { soundOptions, previewSound, type SoundType } from '@/lib/notificationSounds';

interface PeriodReminderSettingsProps {
  settings: ReminderSettings;
  onSettingsChange: (settings: Partial<ReminderSettings>) => void;
  notificationPermission: NotificationPermission;
  onRequestPermission: () => Promise<boolean>;
}

export function PeriodReminderSettings({
  settings,
  onSettingsChange,
  notificationPermission,
  onRequestPermission,
}: PeriodReminderSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    await onRequestPermission();
    setIsRequestingPermission(false);
  };

  // التحقق من دعم الاهتزاز
  const isVibrationSupported = 'vibrate' in navigator;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {settings.enabled ? (
            <Bell className="w-4 h-4 text-primary" />
          ) : (
            <BellOff className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">التذكير</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            إعدادات التذكير بالحصص
          </DialogTitle>
          <DialogDescription>
            احصل على تنبيه قبل بداية كل حصة مع صوت واهتزاز
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* تفعيل/تعطيل التذكير */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                settings.enabled ? "bg-primary/10" : "bg-muted"
              )}>
                {settings.enabled ? (
                  <Bell className="w-5 h-5 text-primary" />
                ) : (
                  <BellOff className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <Label htmlFor="reminder-enabled" className="text-base font-medium">
                  تفعيل التذكير
                </Label>
                <p className="text-sm text-muted-foreground">
                  تنبيه قبل بداية الحصص
                </p>
              </div>
            </div>
            <Switch
              id="reminder-enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => onSettingsChange({ enabled: checked })}
            />
          </div>

          {settings.enabled && (
            <>
              {/* وقت التنبيه */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  وقت التنبيه قبل الحصة
                </Label>
                <Select
                  value={String(settings.minutesBefore)}
                  onValueChange={(value) => onSettingsChange({ minutesBefore: Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">دقيقة واحدة</SelectItem>
                    <SelectItem value="2">دقيقتان</SelectItem>
                    <SelectItem value="3">3 دقائق</SelectItem>
                    <SelectItem value="5">5 دقائق</SelectItem>
                    <SelectItem value="10">10 دقائق</SelectItem>
                    <SelectItem value="15">15 دقيقة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* إعدادات الصوت */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    settings.soundEnabled ? "bg-primary/10" : "bg-muted"
                  )}>
                    {settings.soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-primary" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="sound-enabled" className="text-base font-medium">
                      الصوت
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      تشغيل صوت عند التنبيه
                    </p>
                  </div>
                </div>
                <Switch
                  id="sound-enabled"
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => onSettingsChange({ soundEnabled: checked })}
                />
              </div>

              {/* اختيار نوع الصوت */}
              {settings.soundEnabled && (
                <div className="space-y-3 pr-2 border-r-2 border-primary/20">
                  <Label className="flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    نوع صوت التنبيه
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {soundOptions.map((sound) => (
                      <button
                        key={sound.id}
                        onClick={() => onSettingsChange({ soundType: sound.id })}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-right",
                          settings.soundType === sound.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{sound.nameAr}</div>
                          <div className="text-xs text-muted-foreground truncate">{sound.description}</div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            previewSound(sound.id);
                          }}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* إعدادات الاهتزاز */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    settings.vibrationEnabled && isVibrationSupported ? "bg-primary/10" : "bg-muted"
                  )}>
                    <Vibrate className={cn(
                      "w-5 h-5",
                      settings.vibrationEnabled && isVibrationSupported ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    <Label htmlFor="vibration-enabled" className="text-base font-medium">
                      الاهتزاز
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {isVibrationSupported 
                        ? "اهتزاز الجهاز عند التنبيه"
                        : "غير مدعوم على هذا الجهاز"
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  id="vibration-enabled"
                  checked={settings.vibrationEnabled}
                  onCheckedChange={(checked) => onSettingsChange({ vibrationEnabled: checked })}
                  disabled={!isVibrationSupported}
                />
              </div>

              {/* تكرار التنبيه */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    settings.repeatUntilDismissed ? "bg-primary/10" : "bg-muted"
                  )}>
                    <Repeat className={cn(
                      "w-5 h-5",
                      settings.repeatUntilDismissed ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    <Label htmlFor="repeat-enabled" className="text-base font-medium">
                      تكرار التنبيه
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      استمرار الصوت حتى الإيقاف يدوياً
                    </p>
                  </div>
                </div>
                <Switch
                  id="repeat-enabled"
                  checked={settings.repeatUntilDismissed}
                  onCheckedChange={(checked) => onSettingsChange({ repeatUntilDismissed: checked })}
                />
              </div>

              {/* الفاصل الزمني للتكرار */}
              {settings.repeatUntilDismissed && (
                <div className="space-y-2 pr-2 border-r-2 border-primary/20">
                  <Label className="flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    الفاصل الزمني للتكرار
                  </Label>
                  <Select
                    value={String(settings.repeatIntervalSeconds)}
                    onValueChange={(value) => onSettingsChange({ repeatIntervalSeconds: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">كل 30 ثانية</SelectItem>
                      <SelectItem value="60">كل دقيقة</SelectItem>
                      <SelectItem value="120">كل دقيقتين</SelectItem>
                      <SelectItem value="180">كل 3 دقائق</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* إذن الإشعارات */}
              <Card className={cn(
                "border-2",
                notificationPermission === 'granted' ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Smartphone className={cn(
                      "w-5 h-5 mt-0.5",
                      notificationPermission === 'granted' ? "text-green-600" : "text-amber-600"
                    )} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">إشعارات النظام</span>
                        <Badge variant={notificationPermission === 'granted' ? "default" : "secondary"}>
                          {notificationPermission === 'granted' ? 'مفعّل' : 
                           notificationPermission === 'denied' ? 'مرفوض' : 'غير مفعّل'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notificationPermission === 'granted' 
                          ? "ستتلقى إشعارات حتى عندما تكون في تطبيق آخر"
                          : "فعّل الإشعارات لتتلقى تنبيهات حتى عندما تكون في تطبيق آخر"
                        }
                      </p>
                      {notificationPermission !== 'granted' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={handleRequestPermission}
                          disabled={isRequestingPermission || notificationPermission === 'denied'}
                        >
                          {isRequestingPermission ? 'جاري الطلب...' : 'تفعيل الإشعارات'}
                        </Button>
                      )}
                      {notificationPermission === 'denied' && (
                        <p className="text-xs text-destructive mt-2">
                          تم رفض الإشعارات. يرجى تفعيلها من إعدادات المتصفح.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ملاحظة التوافقية */}
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p className="font-medium mb-1">ملاحظة التوافقية:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>✅ الصوت يعمل على جميع الأجهزة</li>
                  <li>✅ الإشعارات تعمل على iPhone و Android</li>
                  <li>⚠️ الاهتزاز يعمل على Android فقط</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
