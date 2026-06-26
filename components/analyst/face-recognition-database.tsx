"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  RefreshCw,
  User,
  Database,
  Calendar,
  AlertCircle,
  Loader2,
  FileImage,
  Inbox,
  UserPlus,
} from "lucide-react";

interface RegisteredPerson {
  id: string;
  full_name: string;
  gender?: string;
  age?: number;
  case_number?: string;
  notes?: string;
  created_at?: string;
  registered_images: string[];
}

const FACE_BACKEND_URL = process.env.NEXT_PUBLIC_FACE_BACKEND_URL || "http://localhost:5001";

interface FaceRecognitionDatabaseProps {
  onNavigateToRegister?: () => void;
}

export default function FaceRecognitionDatabase({ onNavigateToRegister }: FaceRecognitionDatabaseProps) {
  const [persons, setPersons] = useState<RegisteredPerson[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getImageUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${FACE_BACKEND_URL}${path}`;
  };

  const fetchDatabase = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/faces/list");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load database records.");
      }
      if (data.success) {
        setPersons(data.persons || []);
      } else {
        throw new Error(data.error || "Failed to retrieve persons.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while fetching database faces.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabase();
  }, []);

  const filteredPersons = persons.filter((person) => {
    const nameMatch = person.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const caseMatch = person.case_number?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const notesMatch = person.notes?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    return nameMatch || caseMatch || notesMatch;
  });

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, case number, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50 h-10 rounded-xl"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchDatabase}
            disabled={isLoading}
            className="h-10 w-10 rounded-xl cursor-pointer hover:bg-muted/80"
            title="Refresh database list"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-border bg-card/20 animate-pulse rounded-2xl h-80 overflow-hidden">
                <div className="h-40 bg-muted/40" />
                <CardHeader className="space-y-2 p-5">
                  <div className="h-5 w-2/3 bg-muted/40 rounded" />
                  <div className="h-4 w-1/2 bg-muted/40 rounded" />
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-2">
                  <div className="h-3 w-full bg-muted/40 rounded" />
                  <div className="h-3 w-4/5 bg-muted/40 rounded" />
                </CardContent>
              </Card>
            ))}
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">Error Fetching Records</p>
              <p className="text-xs opacity-90">{error}</p>
              <Button onClick={fetchDatabase} variant="link" className="p-0 h-auto text-destructive underline font-semibold text-xs mt-1">
                Try again
              </Button>
            </div>
          </motion.div>
        ) : filteredPersons.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border/80 rounded-2xl text-center bg-background/20"
          >
            <div className="p-4 rounded-full bg-muted/40 border border-border mb-4">
              {searchQuery ? <Inbox className="h-8 w-8 text-muted-foreground" /> : <Database className="h-8 w-8 text-muted-foreground" />}
            </div>
            <h3 className="text-lg font-bold">
              {searchQuery ? "No matching records found" : "No face biometric records found"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
              {searchQuery
                ? `We couldn't find any registered profiles matching "${searchQuery}". Try revising your search.`
                : "The pgvector database is currently empty. Register target profiles to enable recognition match detection."}
            </p>
            {onNavigateToRegister && (
              <Button onClick={onNavigateToRegister} className="rounded-xl flex items-center gap-2 cursor-pointer shadow-md bg-primary hover:bg-primary/95 text-primary-foreground">
                <UserPlus className="h-4 w-4" />
                Register First Person
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredPersons.map((person) => {
              const imageSrc = person.registered_images?.[0] ? getImageUrl(person.registered_images[0]) : "";
              const totalPhotos = person.registered_images?.length || 0;

              return (
                <Card
                  key={person.id}
                  className="group border border-border/70 hover:border-primary/40 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all duration-300 rounded-2xl overflow-hidden shadow-sm hover:shadow-md flex flex-col h-full"
                >
                  {/* Subject Image Cover */}
                  <div className="relative h-44 bg-muted/20 overflow-hidden border-b border-border/40 shrink-0">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={person.full_name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 text-primary/40">
                        <User className="h-12 w-12" />
                        <span className="text-[10px] uppercase font-bold tracking-wider mt-1 text-muted-foreground">No image available</span>
                      </div>
                    )}
                    
                    {/* Badge showing photo count */}
                    {totalPhotos > 0 && (
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1 shadow-sm">
                        <FileImage className="h-3 w-3" />
                        {totalPhotos} Reference{totalPhotos > 1 ? "s" : ""}
                      </div>
                    )}

                    {/* Case Badge if present */}
                    {person.case_number && (
                      <div className="absolute bottom-3 right-3">
                        <Badge variant="secondary" className="bg-primary/20 hover:bg-primary/25 text-primary border border-primary/20 backdrop-blur-md font-bold py-0.5 px-2.5 rounded-lg text-[10px] tracking-wide uppercase">
                          {person.case_number}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardHeader className="p-5 pb-3">
                    <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      {person.full_name}
                    </CardTitle>
                    <CardDescription className="text-xs flex flex-wrap gap-x-3 gap-y-1 mt-1 text-muted-foreground">
                      {person.gender && <span>Gender: <strong className="text-foreground/80">{person.gender}</strong></span>}
                      {person.age && <span>Age: <strong className="text-foreground/80">{person.age}</strong></span>}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 flex flex-col justify-between flex-grow">
                    {/* Notes block */}
                    <div className="flex-grow">
                      {person.notes ? (
                        <p className="text-xs text-muted-foreground line-clamp-3 bg-background/40 hover:bg-background/60 border border-border/40 p-2.5 rounded-xl italic transition-colors leading-relaxed">
                          "{person.notes}"
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground/60 italic p-2.5 border border-dashed border-border/40 rounded-xl">
                          No additional metadata / notes recorded for this subject.
                        </p>
                      )}
                    </div>

                    {/* Created at date */}
                    {person.created_at && (
                      <div className="mt-4 pt-3.5 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground/80 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 opacity-80" />
                          Registered on:
                        </span>
                        <span>
                          {new Date(person.created_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
