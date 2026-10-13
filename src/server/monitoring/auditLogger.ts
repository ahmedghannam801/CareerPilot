/**
 * CareerPilot AI - Security & Administrative Audit Logging
 * Records immutable audit trail for privileged operations with actor identification.
 */

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorRole: 'admin' | 'system' | 'superadmin';
  action: string;
  resourceType: string;
  resourceId?: string;
  status: 'SUCCESS' | 'DENIED' | 'FAILED';
  clientIp?: string;
  details?: Record<string, unknown>;
}

class SecurityAuditLogger {
  private auditEntries: AuditLogEntry[] = [];
  private readonly MAX_ENTRIES = 500;

  public logEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    this.auditEntries.unshift(fullEntry);
    if (this.auditEntries.length > this.MAX_ENTRIES) {
      this.auditEntries.pop();
    }

    // Always emit security audit logs in structured format
    console.log(
      JSON.stringify({
        level: entry.status === 'DENIED' ? 'warn' : 'info',
        event: 'SECURITY_AUDIT',
        ...fullEntry,
      })
    );

    return fullEntry;
  }

  public getRecentLogs(limit = 100): AuditLogEntry[] {
    return this.auditEntries.slice(0, Math.min(limit, this.MAX_ENTRIES));
  }
}

export const auditLogger = new SecurityAuditLogger();
