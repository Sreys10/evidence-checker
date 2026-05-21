"use client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserCheck, Clock, Shield, Bell, Flag, Search, Eye, MessageSquare, FileText, X, CheckCircle2 } from "lucide-react";

type User = { _id?:string; name:string; email:string; userType:string; lastLogin?:string|Date; createdAt?:string|Date; status?:string; };
type Notification = { id:string; type:string; title:string; message:string; reportId?:string; reportData?:{fileName:string;evidenceName:string;status:string;confidence:number;generatedDate:string;format?:string;generatedBy?:{name:string;email:string}}; timestamp:string; read:boolean; };
type FlaggedReport = { id:string; reportId:string; evidenceName:string; status:string; confidence:number; generatedBy:{name:string;email:string}; flaggedAt:string; };

const getTimeAgo = (date:string|Date|undefined) => {
  if (!date) return "Never";
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
};

const getUserTypeColor = (t:string) => {
  if (t==='admin') return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
  if (t==='analyst') return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  if (t==='verifier') return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
  return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
};

// ── OVERVIEW ──────────────────────────────────────────
interface OverviewProps {
  stats: {title:string;value:number;icon:React.ElementType;color:string}[];
  unreadCount: number;
  flaggedCount: number;
  totalUsers: number;
  onNavigate: (tab:string) => void;
}
export function OverviewTab({ stats, unreadCount, flaggedCount, totalUsers, onNavigate }: OverviewProps) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={i} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}>
              <Card className="hover:shadow-md transition-shadow cursor-default">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{s.title}</p>
                      <p className="text-3xl font-bold mt-0.5">{s.value}</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Icon className={`h-6 w-6 ${s.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label:'Manage Users', sub:`${totalUsers} registered`, icon:Users, color:'text-blue-500', bg:'bg-blue-500/10', tab:'users' },
          { label:'Notifications', sub:`${unreadCount} unread`, icon:Bell, color:'text-orange-500', bg:'bg-orange-500/10', tab:'notifications' },
          { label:'Flagged Reports', sub:`${flaggedCount} flagged`, icon:Flag, color:'text-red-500', bg:'bg-red-500/10', tab:'flagged' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <Card key={item.tab} className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5" onClick={() => onNavigate(item.tab)}>
              <CardContent className="pt-5 pb-4 flex items-center gap-4">
                <div className={`h-12 w-12 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── USERS ──────────────────────────────────────────────
interface UsersTabProps {
  users: User[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (v:string) => void;
  filterType: string;
  setFilterType: (v:string) => void;
  selectedUser: User | null;
  setSelectedUser: (u:User|null) => void;
  onViewProfile: (u:User) => void;
  onMessageUser: (u:User) => void;
  onDeleteUser: (id:string) => void;
  currentUserId?: string;
}
export function UsersTab({ users, isLoading, searchQuery, setSearchQuery, filterType, setFilterType, selectedUser, setSelectedUser, onViewProfile, onMessageUser, onDeleteUser, currentUserId }: UsersTabProps) {
  const filtered = users.filter(u =>
    (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
    u.userType === filterType
  );
  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search users..." className="w-full pl-10 pr-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {['admin','analyst','verifier','guest'].map(t => (
              <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1.5 text-xs rounded-lg font-medium capitalize transition-all ${filterType===t?'bg-primary text-primary-foreground':'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{t}</button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Loading users...</div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-16 text-center text-muted-foreground"><Users className="h-10 w-10 mx-auto mb-2 opacity-30"/><p className="text-sm">No users found</p></CardContent></Card>
          ) : filtered.map((user, i) => (
            <motion.div key={user._id||i} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.03}}>
              <Card className={`cursor-pointer hover:shadow-md transition-all ${selectedUser?._id===user._id?'ring-2 ring-primary':''}`} onClick={()=>setSelectedUser(user)}>
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <div className="relative shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={`text-sm font-semibold ${getUserTypeColor(user.userType)}`}>{user.name.split(' ').map(n=>n[0]).join('').toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${user.status==='online'?'bg-green-500':'bg-gray-400'}`}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{user.name}</p>
                      <Badge variant="outline" className={`text-[10px] h-4 shrink-0 ${getUserTypeColor(user.userType)}`}>{user.userType}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground shrink-0">{getTimeAgo(user.lastLogin)}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      <div>
        {selectedUser ? (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14 ring-2 ring-primary/20 shrink-0">
                    <AvatarFallback className={`text-xl font-bold ${getUserTypeColor(selectedUser.userType)}`}>{selectedUser.name.split(' ').map(n=>n[0]).join('').toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{selectedUser.name}</CardTitle>
                    <CardDescription className="text-xs truncate">{selectedUser.email}</CardDescription>
                    <Badge variant="outline" className={`text-[10px] mt-1 ${getUserTypeColor(selectedUser.userType)}`}>{selectedUser.userType}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4 shrink-0"/><span className="text-xs">Last login: {getTimeAgo(selectedUser.lastLogin)}</span></div>
                {selectedUser.createdAt && <div className="flex items-center gap-2 text-muted-foreground"><Shield className="h-4 w-4 shrink-0"/><span className="text-xs">Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}</span></div>}
                <div className="pt-3 border-t space-y-2">
                  <Button variant="outline" className="w-full text-sm h-9" onClick={()=>onViewProfile(selectedUser)}><Eye className="h-4 w-4 mr-2"/>View Full Profile</Button>
                  {selectedUser.userType !== 'admin' && (
                    <Button variant="outline" className="w-full text-sm h-9 gap-2 border-primary/20 hover:bg-primary/10" onClick={()=>onMessageUser(selectedUser)}><MessageSquare className="h-4 w-4 text-primary"/>Message {selectedUser.name.split(' ')[0]}</Button>
                  )}
                  <Button variant="destructive" className="w-full text-sm h-9" onClick={()=>selectedUser._id&&onDeleteUser(selectedUser._id)} disabled={selectedUser._id===currentUserId}>Delete User</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Card><CardContent className="py-20 text-center text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-3 opacity-30"/><p className="text-sm">Select a user to view details</p></CardContent></Card>
        )}
      </div>
    </div>
  );
}

// ── NOTIFICATIONS ────────────────────────────────────
interface NotificationsTabProps {
  notifications: Notification[];
  onMarkRead: (id:string) => void;
  onMarkAllRead: () => void;
  onFlag: (n:Notification) => void;
  onDismiss: (id:string) => void;
}
export function NotificationsTab({ notifications, onMarkRead, onMarkAllRead, onFlag, onDismiss }: NotificationsTabProps) {
  const visible = notifications.filter(n => !(n as unknown as {archived?:boolean}).archived);
  const unread = visible.filter(n=>!n.read).length;
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{visible.length} Notifications {unread > 0 && <span className="text-xs text-muted-foreground ml-1">({unread} unread)</span>}</h2>
        {unread > 0 && <Button variant="outline" size="sm" onClick={onMarkAllRead}><CheckCircle2 className="h-4 w-4 mr-2"/>Mark all read</Button>}
      </div>
      {visible.length === 0 ? (
        <Card><CardContent className="py-20 text-center text-muted-foreground"><Bell className="h-12 w-12 mx-auto mb-3 opacity-30"/><p>No notifications yet</p></CardContent></Card>
      ) : visible.map((n, i) => (
        <motion.div key={n.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}>
          <Card className={`transition-all ${!n.read?'border-primary/30 bg-primary/5':''}`}>
            <CardContent className="py-3 px-4 flex items-start gap-3">
              <div className={`h-2 w-2 mt-2 rounded-full shrink-0 ${!n.read?'bg-primary':'bg-muted-foreground/30'}`}/>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${!n.read?'text-foreground':'text-muted-foreground'}`}>{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.timestamp).toLocaleString()}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                {!n.read && <Button variant="ghost" size="icon" className="h-7 w-7" title="Mark read" onClick={()=>onMarkRead(n.id)}><CheckCircle2 className="h-3.5 w-3.5"/></Button>}
                {n.reportData && <Button variant="ghost" size="icon" className="h-7 w-7 text-orange-500 hover:text-orange-600" title="Flag" onClick={()=>onFlag(n)}><Flag className="h-3.5 w-3.5"/></Button>}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Dismiss" onClick={()=>onDismiss(n.id)}><X className="h-3.5 w-3.5"/></Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// ── FLAGGED REPORTS ──────────────────────────────────
interface FlaggedTabProps {
  flaggedReports: FlaggedReport[];
  onRemove: (id:string) => void;
}
export function FlaggedTab({ flaggedReports, onRemove }: FlaggedTabProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h2 className="font-semibold">{flaggedReports.length} Flagged Reports</h2>
      {flaggedReports.length === 0 ? (
        <Card><CardContent className="py-20 text-center text-muted-foreground"><Flag className="h-12 w-12 mx-auto mb-3 opacity-30"/><p>No flagged reports</p><p className="text-xs mt-1">Flag reports from the Notifications tab</p></CardContent></Card>
      ) : flaggedReports.map((r, i) => (
        <motion.div key={r.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}>
          <Card className="border-orange-500/20 bg-orange-500/5">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-500 shrink-0"/>
                  <p className="font-semibold text-sm truncate">{r.evidenceName}</p>
                  <Badge variant={r.status==='tampered'?'destructive':'default'} className="text-[10px] shrink-0">{r.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Confidence: {r.confidence.toFixed(1)}% · By: {r.generatedBy.name}</p>
                <p className="text-[10px] text-muted-foreground">Flagged: {new Date(r.flaggedAt).toLocaleString()}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 hover:text-destructive" onClick={()=>onRemove(r.id)}><X className="h-4 w-4"/></Button>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
