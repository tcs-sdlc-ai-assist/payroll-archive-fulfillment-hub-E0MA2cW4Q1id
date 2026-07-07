import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { loadEmployees, loadDocuments, loadAssistantResponses } from '../utils/fixtureLoader';
import { filterEmployees, filterDocuments } from '../utils/searchUtils';
import { useRBAC } from './RBACContext';
import { useAudit } from './AuditContext';
import { ACTION_TYPES, DOCUMENT_TYPES } from '../utils/constants';

/**
 * @typedef {Object} Message
 * @property {string} id - Unique message identifier
 * @property {'user'|'assistant'} role - Who sent the message
 * @property {string} text - The message text content
 * @property {string} timestamp - ISO 8601 timestamp
 * @property {string[]} [suggestedActions] - Optional suggested follow-up actions
 * @property {Object[]} [employees] - Optional employee results attached to message
 * @property {Object[]} [documents] - Optional document results attached to message
 */

/**
 * @typedef {Object} PendingAction
 * @property {string} type - The action type (download, email, package)
 * @property {Object} document - The document involved
 * @property {Object} [employee] - The employee involved
 * @property {string} confirmationPrompt - The prompt to display for confirmation
 */

/**
 * @typedef {Object} AssistantContextValue
 * @property {Message[]} messages - Conversation history
 * @property {boolean} isOpen - Whether the assistant panel is open
 * @property {PendingAction|null} pendingAction - Current pending action awaiting confirmation
 * @property {Function} sendMessage - Send a user message and get a response
 * @property {Function} toggleAssistant - Toggle the assistant panel open/closed
 * @property {Function} confirmAction - Confirm the pending action
 * @property {Function} cancelAction - Cancel the pending action
 */

const AssistantContext = createContext(null);

/**
 * Generates a unique message ID.
 * @returns {string} A unique message ID
 */
function generateMessageId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `MSG_${timestamp}_${random}`;
}

/**
 * Creates a message object.
 * @param {'user'|'assistant'} role - The message sender role
 * @param {string} text - The message text
 * @param {Object} [extras] - Additional properties to attach
 * @returns {Message} The message object
 */
function createMessage(role, text, extras = {}) {
  return {
    id: generateMessageId(),
    role,
    text,
    timestamp: new Date().toISOString(),
    ...extras,
  };
}

/**
 * Extracts a year from a query string.
 * @param {string} query - The query string
 * @returns {string|null} The extracted year or null
 */
function extractYear(query) {
  const yearMatch = query.match(/\b(2019|2020|2021|2022|2023|2024|2025)\b/);
  return yearMatch ? yearMatch[1] : null;
}

/**
 * Extracts a document type from a query string.
 * @param {string} query - The query string
 * @returns {string|null} The extracted document type or null
 */
function extractDocumentType(query) {
  const lower = query.toLowerCase();
  if (lower.includes('w-2') || lower.includes('w2') || lower.includes('tax form') || lower.includes('wage statement')) {
    return DOCUMENT_TYPES.W2;
  }
  if (lower.includes('paystub') || lower.includes('pay stub') || lower.includes('paycheck') || lower.includes('pay slip') || lower.includes('earnings statement')) {
    return DOCUMENT_TYPES.PAYSTUB;
  }
  return null;
}

/**
 * Extracts a potential employee name from a query string.
 * Attempts to find capitalized name patterns after common keywords.
 * @param {string} query - The query string
 * @returns {string|null} The extracted name or null
 */
function extractEmployeeName(query) {
  const patterns = [
    /(?:for|find|search|look up|employee named|who is|show me|get|email|download)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:'s|'s)?\s+(?:w-?2|paystub|pay stub|document|record)/i,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)/,
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      const stopWords = ['Find', 'Search', 'Show', 'Get', 'Email', 'Download', 'Preview', 'View', 'Package', 'All', 'The', 'For'];
      if (!stopWords.includes(name.split(' ')[0])) {
        return name;
      }
    }
  }

  return null;
}

/**
 * Extracts a Kelly ID from a query string.
 * @param {string} query - The query string
 * @returns {string|null} The extracted Kelly ID or null
 */
function extractKellyId(query) {
  const match = query.match(/\b(K\d{5,6})\b/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Extracts last 4 SSN digits from a query string.
 * @param {string} query - The query string
 * @returns {string|null} The extracted last 4 SSN digits or null
 */
function extractLast4SSN(query) {
  const lower = query.toLowerCase();
  if (lower.includes('ssn') || lower.includes('social security') || lower.includes('last 4') || lower.includes('last four')) {
    const match = query.match(/\b(\d{4})\b/);
    return match ? match[1] : null;
  }
  return null;
}

/**
 * Determines the intent of a query.
 * @param {string} query - The query string
 * @param {Object} responses - The assistant responses data
 * @returns {string} The detected intent
 */
function detectIntent(query) {
  const lower = query.toLowerCase();

  const greetingKeywords = ['hello', 'hi', 'hey', 'good morning', 'good afternoon'];
  if (greetingKeywords.some((kw) => lower.includes(kw))) {
    return 'greeting';
  }

  const helpKeywords = ['help', 'what can you do', 'how does this work', 'guide'];
  if (helpKeywords.some((kw) => lower.includes(kw))) {
    return 'help';
  }

  const archiveHealthKeywords = ['archive health', 'archive status', 'ingestion', 'completeness', 'data quality'];
  if (archiveHealthKeywords.some((kw) => lower.includes(kw))) {
    return 'archive_health';
  }

  const exceptionKeywords = ['exceptions', 'errors', 'issues', 'problems', 'unresolved', 'failed'];
  if (exceptionKeywords.some((kw) => lower.includes(kw))) {
    return 'view_exceptions';
  }

  const auditKeywords = ['audit log', 'audit trail', 'activity log', 'who accessed', 'access history'];
  if (auditKeywords.some((kw) => lower.includes(kw))) {
    return 'audit_query';
  }

  const emailKeywords = ['email', 'send', 'mail', 'deliver', 'forward'];
  if (emailKeywords.some((kw) => lower.includes(kw))) {
    return 'fulfillment_email';
  }

  const downloadKeywords = ['download', 'save', 'get file', 'export'];
  if (downloadKeywords.some((kw) => lower.includes(kw))) {
    return 'fulfillment_download';
  }

  const packageKeywords = ['package', 'bundle', 'combine', 'zip', 'multi-year', 'multiple documents', 'all w-2s'];
  if (packageKeywords.some((kw) => lower.includes(kw))) {
    return 'fulfillment_package';
  }

  const previewKeywords = ['preview', 'view', 'show me', 'open', 'display', 'look at'];
  if (previewKeywords.some((kw) => lower.includes(kw))) {
    return 'preview';
  }

  const docKeywords = ['w-2', 'w2', 'paystub', 'pay stub', 'document', 'tax form', 'paycheck'];
  if (docKeywords.some((kw) => lower.includes(kw))) {
    return 'document_search';
  }

  const searchKeywords = ['find', 'search', 'look up', 'employee', 'who is'];
  if (searchKeywords.some((kw) => lower.includes(kw))) {
    return 'employee_search';
  }

  return 'unknown';
}

/**
 * Assistant Context Provider — manages conversational assistant state.
 * Handles conversation history, query processing, pending confirmations,
 * and assistant panel visibility.
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function AssistantProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [assistantResponses, setAssistantResponses] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const { currentUser, hasPermission } = useRBAC();
  const { logEvent } = useAudit();

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [empData, docData, respData] = await Promise.all([
          loadEmployees(),
          loadDocuments(),
          loadAssistantResponses(),
        ]);

        if (!cancelled) {
          setEmployees(Array.isArray(empData) ? empData : []);
          setDocuments(Array.isArray(docData) ? docData : []);
          setAssistantResponses(respData || null);
          setDataLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setEmployees([]);
          setDocuments([]);
          setAssistantResponses(null);
          setDataLoaded(true);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Toggles the assistant panel open/closed.
   */
  const toggleAssistant = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next && messages.length === 0) {
        const greeting = createMessage(
          'assistant',
          "Hello! I'm the Payroll Archive Assistant. I can help you search for employees, find historical documents like W-2s and paystubs, or fulfill document requests. How can I assist you today?",
          {
            suggestedActions: ['Search for an employee', 'Find a W-2', 'Find a paystub', 'Check archive health'],
          }
        );
        setMessages([greeting]);
      }
      return next;
    });
  }, [messages.length]);

  /**
   * Processes a user query and generates an assistant response.
   * @param {string} query - The user's message text
   */
  const sendMessage = useCallback(
    (query) => {
      if (!query || typeof query !== 'string' || query.trim() === '') {
        return;
      }

      const trimmedQuery = query.trim();
      const userMessage = createMessage('user', trimmedQuery);
      setMessages((prev) => [...prev, userMessage]);

      if (!dataLoaded) {
        const loadingMsg = createMessage('assistant', 'Please wait, I am loading data...');
        setMessages((prev) => [...prev, loadingMsg]);
        return;
      }

      if (pendingAction) {
        const lower = trimmedQuery.toLowerCase();
        const yesKeywords = ['yes', 'confirm', 'proceed', 'go ahead', 'do it', 'ok', 'okay', 'sure', 'approved'];
        const noKeywords = ['no', 'cancel', 'stop', 'nevermind', 'never mind', 'abort', "don't", 'back'];

        if (yesKeywords.some((kw) => lower.includes(kw))) {
          confirmAction();
          return;
        }

        if (noKeywords.some((kw) => lower.includes(kw))) {
          cancelAction();
          return;
        }
      }

      const intent = detectIntent(trimmedQuery);

      switch (intent) {
        case 'greeting': {
          const resp = createMessage(
            'assistant',
            "Hello! I'm the Payroll Archive Assistant. I can help you search for employees, find historical documents like W-2s and paystubs, or fulfill document requests. How can I assist you today?",
            {
              suggestedActions: ['Search for an employee', 'Find a W-2', 'Find a paystub', 'Check archive health'],
            }
          );
          setMessages((prev) => [...prev, resp]);
          break;
        }

        case 'help': {
          const resp = createMessage(
            'assistant',
            "I can help you with the following:\n\n• **Search employees** by name, Kelly ID, or last 4 SSN\n• **Find documents** such as W-2s and paystubs for any year from 2019–2024\n• **Preview, download, or email** documents to employees\n• **Package multiple documents** for legal or tax requests\n• **Check archive health** and review audit logs\n\nJust type your request in plain language!",
            {
              suggestedActions: ['Search for an employee', 'Find a W-2', 'View archive health'],
            }
          );
          setMessages((prev) => [...prev, resp]);
          break;
        }

        case 'archive_health': {
          const resp = createMessage(
            'assistant',
            'You can view the archive health status on the Dashboard page. It shows total files ingested, ingestion success rate, failed records, missing metadata, and unresolved exceptions.',
            {
              suggestedActions: ['View exceptions', 'View audit log', 'Search for an employee'],
            }
          );
          setMessages((prev) => [...prev, resp]);
          break;
        }

        case 'view_exceptions': {
          const resp = createMessage(
            'assistant',
            'You can view unresolved exceptions on the Dashboard page under the Archive Health section. Exceptions include missing SSNs, duplicate records, missing metadata, corrupt files, and more.',
            {
              suggestedActions: ['View archive health', 'Search for an employee', 'View audit log'],
            }
          );
          setMessages((prev) => [...prev, resp]);
          break;
        }

        case 'audit_query': {
          const resp = createMessage(
            'assistant',
            'You can view the audit log on the Dashboard page. It shows all document access events including previews, downloads, emails, and packages, along with who performed each action.',
            {
              suggestedActions: ['Search for an employee', 'View archive health'],
            }
          );
          setMessages((prev) => [...prev, resp]);
          break;
        }

        case 'employee_search': {
          handleEmployeeSearch(trimmedQuery);
          break;
        }

        case 'document_search': {
          handleDocumentSearch(trimmedQuery);
          break;
        }

        case 'preview': {
          handleDocumentSearch(trimmedQuery);
          break;
        }

        case 'fulfillment_download': {
          handleFulfillment(trimmedQuery, ACTION_TYPES.DOWNLOAD);
          break;
        }

        case 'fulfillment_email': {
          handleFulfillment(trimmedQuery, ACTION_TYPES.EMAIL);
          break;
        }

        case 'fulfillment_package': {
          handleFulfillment(trimmedQuery, ACTION_TYPES.PACKAGE);
          break;
        }

        default: {
          const resp = createMessage(
            'assistant',
            "I'm sorry, I didn't understand that request. Could you try rephrasing? Here are some things I can help with:\n\n• Search for an employee (e.g., \"Find John Smith\")\n• Find a document (e.g., \"Show W-2 for 2024\")\n• Fulfill a request (e.g., \"Email the W-2 to the employee\")\n• Check archive health (e.g., \"Show archive status\")",
            {
              suggestedActions: ['Search employee', 'Find document', 'View archive health', 'View audit log'],
            }
          );
          setMessages((prev) => [...prev, resp]);
          break;
        }
      }
    },
    [dataLoaded, employees, documents, pendingAction, currentUser, selectedEmployee, hasPermission, logEvent]
  );

  /**
   * Handles employee search queries.
   * @param {string} query - The search query
   */
  function handleEmployeeSearch(query) {
    const kellyId = extractKellyId(query);
    const last4SSN = extractLast4SSN(query);
    const name = extractEmployeeName(query);

    let searchTerm = '';
    if (kellyId) {
      searchTerm = kellyId;
    } else if (last4SSN) {
      searchTerm = last4SSN;
    } else if (name) {
      searchTerm = name;
    } else {
      const words = query.replace(/[^\w\s]/g, '').split(/\s+/);
      const stopWords = ['find', 'search', 'for', 'look', 'up', 'employee', 'named', 'who', 'is', 'the', 'a', 'an', 'show', 'me', 'get'];
      const meaningful = words.filter((w) => !stopWords.includes(w.toLowerCase()));
      searchTerm = meaningful.join(' ');
    }

    if (!searchTerm.trim()) {
      const resp = createMessage(
        'assistant',
        'Please provide an employee name, Kelly ID, or last 4 SSN digits to search.',
        {
          suggestedActions: ['Search by name', 'Search by Kelly ID', 'Search by SSN'],
        }
      );
      setMessages((prev) => [...prev, resp]);
      return;
    }

    const results = filterEmployees(employees, searchTerm);

    if (results.length === 0) {
      const resp = createMessage(
        'assistant',
        `I couldn't find any employees matching "${searchTerm}". Please check the spelling or try searching by Kelly ID or last 4 SSN.`,
        {
          suggestedActions: ['Try another search', 'Search by Kelly ID', 'Search by SSN'],
        }
      );
      setMessages((prev) => [...prev, resp]);
      return;
    }

    if (results.length === 1) {
      const emp = results[0];
      setSelectedEmployee(emp);
      const resp = createMessage(
        'assistant',
        `I found employee ${emp.name} (Kelly ID: ${emp.kellyId}, Department: ${emp.department}, Location: ${emp.location}). Would you like to view their documents?`,
        {
          suggestedActions: ['View W-2s', 'View paystubs', 'View all documents'],
          employees: results,
        }
      );
      setMessages((prev) => [...prev, resp]);
      return;
    }

    if (results.length > 1) {
      const resp = createMessage(
        'assistant',
        `I found ${results.length} employees matching "${searchTerm}". Could you help me narrow it down?\n\n${results.map((e) => `• ${e.name} (${e.kellyId}) — ${e.department}, ${e.location}`).join('\n')}`,
        {
          suggestedActions: ['Provide Kelly ID', 'Provide last 4 SSN', 'Specify department'],
          employees: results,
        }
      );
      setMessages((prev) => [...prev, resp]);
      return;
    }
  }

  /**
   * Handles document search queries.
   * @param {string} query - The search query
   */
  function handleDocumentSearch(query) {
    const name = extractEmployeeName(query);
    const kellyId = extractKellyId(query);
    const year = extractYear(query);
    const docType = extractDocumentType(query);

    let targetEmployee = selectedEmployee;

    if (kellyId) {
      const emp = employees.find((e) => e.kellyId === kellyId);
      if (emp) {
        targetEmployee = emp;
        setSelectedEmployee(emp);
      }
    } else if (name) {
      const results = filterEmployees(employees, name);
      if (results.length === 1) {
        targetEmployee = results[0];
        setSelectedEmployee(results[0]);
      } else if (results.length > 1) {
        const resp = createMessage(
          'assistant',
          `I found ${results.length} employees matching "${name}". Could you help me narrow it down?\n\n${results.map((e) => `• ${e.name} (${e.kellyId}) — ${e.department}, ${e.location}`).join('\n')}`,
          {
            suggestedActions: ['Provide Kelly ID', 'Provide last 4 SSN'],
            employees: results,
          }
        );
        setMessages((prev) => [...prev, resp]);
        return;
      } else if (results.length === 0) {
        const resp = createMessage(
          'assistant',
          `I couldn't find any employees matching "${name}". Please check the spelling or try searching by Kelly ID.`,
          {
            suggestedActions: ['Try another search', 'Search by Kelly ID'],
          }
        );
        setMessages((prev) => [...prev, resp]);
        return;
      }
    }

    if (!targetEmployee) {
      const resp = createMessage(
        'assistant',
        'Please specify an employee first. You can search by name, Kelly ID, or last 4 SSN.',
        {
          suggestedActions: ['Search for an employee', 'Search by Kelly ID'],
        }
      );
      setMessages((prev) => [...prev, resp]);
      return;
    }

    const filters = { employeeId: targetEmployee.employeeId };
    if (year) {
      filters.year = year;
    }
    if (docType) {
      filters.documentType = docType;
    }

    const results = filterDocuments(documents, filters);

    if (results.length === 0) {
      const typeLabel = docType || 'document';
      const yearLabel = year ? ` for year ${year}` : '';
      const resp = createMessage(
        'assistant',
        `No ${typeLabel} records found for ${targetEmployee.name}${yearLabel}. The archive covers years 2019–2024 for W-2s and recent quarters for paystubs.`,
        {
          suggestedActions: ['Try another year', 'View all documents', 'Check archive health'],
        }
      );
      setMessages((prev) => [...prev, resp]);
      return;
    }

    const docList = results
      .map((d) => {
        const period = d.period ? ` ${d.period}` : '';
        const status = d.status === 'missing' ? ' ⚠️ MISSING' : '';
        return `• ${d.documentType} ${d.year}${period} — ${d.fileName}${status}`;
      })
      .join('\n');

    const resp = createMessage(
      'assistant',
      `Here are the documents for ${targetEmployee.name}:\n\n${docList}`,
      {
        suggestedActions: ['Preview document', 'Download document', 'Email to employee', 'Package documents'],
        documents: results,
      }
    );
    setMessages((prev) => [...prev, resp]);
  }

  /**
   * Handles fulfillment queries (download, email, package).
   * @param {string} query - The search query
   * @param {string} actionType - The fulfillment action type
   */
  function handleFulfillment(query, actionType) {
    const name = extractEmployeeName(query);
    const kellyId = extractKellyId(query);
    const year = extractYear(query);
    const docType = extractDocumentType(query);

    let targetEmployee = selectedEmployee;

    if (kellyId) {
      const emp = employees.find((e) => e.kellyId === kellyId);
      if (emp) {
        targetEmployee = emp;
        setSelectedEmployee(emp);
      }
    } else if (name) {
      const results = filterEmployees(employees, name);
      if (results.length === 1) {
        targetEmployee = results[0];
        setSelectedEmployee(results[0]);
      } else if (results.length > 1) {
        const resp = createMessage(
          'assistant',
          `I found ${results.length} employees matching "${name}". Please specify which employee.`,
          {
            suggestedActions: ['Provide Kelly ID', 'Provide last 4 SSN'],
            employees: results,
          }
        );
        setMessages((prev) => [...prev, resp]);
        return;
      }
    }

    if (!targetEmployee) {
      const resp = createMessage(
        'assistant',
        'Please specify an employee first before I can fulfill a document request.',
        {
          suggestedActions: ['Search for an employee'],
        }
      );
      setMessages((prev) => [...prev, resp]);
      return;
    }

    const permissionMap = {
      [ACTION_TYPES.DOWNLOAD]: 'download',
      [ACTION_TYPES.EMAIL]: 'email',
      [ACTION_TYPES.PACKAGE]: 'package',
    };

    const requiredPermission = permissionMap[actionType];
    if (requiredPermission && !hasPermission(requiredPermission)) {
      const userRole = currentUser ? currentUser.role : 'Unknown';
      const resp = createMessage(
        'assistant',
        `Access denied. Your role (${userRole}) does not have permission to ${actionType} documents. If you believe this is an error, please contact your supervisor or the system administrator.`,
        {
          suggestedActions: ['Go to dashboard', 'Try a different action'],
        }
      );
      setMessages((prev) => [...prev, resp]);

      if (currentUser) {
        logEvent({
          userId: currentUser.userId,
          userName: currentUser.displayName,
          userRole: currentUser.role,
          actionType: ACTION_TYPES.DENIED,
          employeeId: targetEmployee.employeeId,
          details: {
            employeeName: targetEmployee.name,
            status: 'denied',
            reason: `Insufficient permissions for ${actionType}`,
          },
        });
      }
      return;
    }

    const filters = { employeeId: targetEmployee.employeeId };
    if (year) {
      filters.year = year;
    }
    if (docType) {
      filters.documentType = docType;
    }

    const availableDocs = filterDocuments(documents, filters).filter((d) => d.status === 'available');

    if (availableDocs.length === 0) {
      const resp = createMessage(
        'assistant',
        `No available documents found for ${targetEmployee.name} matching your criteria. The document may be missing or not yet ingested.`,
        {
          suggestedActions: ['View all documents', 'Check archive health', 'Try another search'],
        }
      );
      setMessages((prev) => [...prev, resp]);
      return;
    }

    if (actionType === ACTION_TYPES.PACKAGE) {
      const yearRange = [...new Set(availableDocs.map((d) => d.year))].sort().join('–');
      const confirmPrompt = `Please confirm: You are about to package ${availableDocs.length} document(s) for ${targetEmployee.name} covering ${yearRange}. This action will be recorded in the audit log. Proceed?`;

      setPendingAction({
        type: ACTION_TYPES.PACKAGE,
        documents: availableDocs,
        employee: targetEmployee,
        confirmationPrompt: confirmPrompt,
      });

      const resp = createMessage('assistant', confirmPrompt, {
        suggestedActions: ['Confirm package', 'Cancel'],
      });
      setMessages((prev) => [...prev, resp]);
      return;
    }

    const targetDoc = availableDocs[0];

    if (actionType === ACTION_TYPES.DOWNLOAD) {
      const confirmPrompt = `Please confirm: You are about to download ${targetDoc.fileName}. This action will be recorded in the audit log. Proceed?`;

      setPendingAction({
        type: ACTION_TYPES.DOWNLOAD,
        document: targetDoc,
        employee: targetEmployee,
        confirmationPrompt: confirmPrompt,
      });

      const resp = createMessage('assistant', confirmPrompt, {
        suggestedActions: ['Confirm download', 'Cancel', 'Preview instead'],
      });
      setMessages((prev) => [...prev, resp]);
      return;
    }

    if (actionType === ACTION_TYPES.EMAIL) {
      const confirmPrompt = `Please confirm: You are about to email ${targetDoc.fileName} to ${targetEmployee.email}. This action will be recorded in the audit log. Proceed?`;

      setPendingAction({
        type: ACTION_TYPES.EMAIL,
        document: targetDoc,
        employee: targetEmployee,
        confirmationPrompt: confirmPrompt,
      });

      const resp = createMessage('assistant', confirmPrompt, {
        suggestedActions: ['Confirm email', 'Cancel', 'Download instead'],
      });
      setMessages((prev) => [...prev, resp]);
      return;
    }
  }

  /**
   * Confirms the pending action and logs the audit event.
   */
  const confirmAction = useCallback(() => {
    if (!pendingAction) {
      return;
    }

    const action = pendingAction;
    setPendingAction(null);

    if (currentUser) {
      if (action.type === ACTION_TYPES.PACKAGE) {
        const years = [...new Set(action.documents.map((d) => d.year))].sort();
        logEvent({
          userId: currentUser.userId,
          userName: currentUser.displayName,
          userRole: currentUser.role,
          actionType: ACTION_TYPES.PACKAGE,
          employeeId: action.employee.employeeId,
          details: {
            documentType: action.documents[0]?.documentType || 'Mixed',
            years,
            employeeName: action.employee.name,
            status: 'success',
            documentCount: action.documents.length,
          },
        });

        const resp = createMessage(
          'assistant',
          `Document package created successfully with ${action.documents.length} document(s) for ${action.employee.name}. The audit log has been updated.`,
          {
            suggestedActions: ['Download package', 'Email package', 'Search another employee', 'View audit log'],
          }
        );
        setMessages((prev) => [...prev, resp]);
      } else if (action.type === ACTION_TYPES.DOWNLOAD) {
        logEvent({
          userId: currentUser.userId,
          userName: currentUser.displayName,
          userRole: currentUser.role,
          actionType: ACTION_TYPES.DOWNLOAD,
          documentId: action.document.documentId,
          employeeId: action.employee.employeeId,
          details: {
            documentType: action.document.documentType,
            year: action.document.year,
            employeeName: action.employee.name,
            status: 'success',
          },
        });

        const resp = createMessage(
          'assistant',
          `Download initiated for ${action.document.fileName}. The audit log has been updated.`,
          {
            suggestedActions: ['Email this document', 'Package more documents', 'Search another employee', 'View audit log'],
          }
        );
        setMessages((prev) => [...prev, resp]);
      } else if (action.type === ACTION_TYPES.EMAIL) {
        logEvent({
          userId: currentUser.userId,
          userName: currentUser.displayName,
          userRole: currentUser.role,
          actionType: ACTION_TYPES.EMAIL,
          documentId: action.document.documentId,
          employeeId: action.employee.employeeId,
          details: {
            documentType: action.document.documentType,
            year: action.document.year,
            employeeName: action.employee.name,
            recipient: action.employee.email,
            status: 'success',
          },
        });

        const resp = createMessage(
          'assistant',
          `Email sent successfully. ${action.document.fileName} has been delivered to ${action.employee.email}. The audit log has been updated.`,
          {
            suggestedActions: ['Send another document', 'Search another employee', 'View audit log'],
          }
        );
        setMessages((prev) => [...prev, resp]);
      }
    } else {
      const resp = createMessage(
        'assistant',
        'Action could not be completed. No user is currently logged in.',
        {
          suggestedActions: ['Go to dashboard'],
        }
      );
      setMessages((prev) => [...prev, resp]);
    }
  }, [pendingAction, currentUser, logEvent]);

  /**
   * Cancels the pending action.
   */
  const cancelAction = useCallback(() => {
    setPendingAction(null);

    const resp = createMessage(
      'assistant',
      'Request cancelled. No action has been taken. How else can I help you?',
      {
        suggestedActions: ['Search for an employee', 'Find a document', 'View archive health'],
      }
    );
    setMessages((prev) => [...prev, resp]);
  }, []);

  const value = useMemo(
    () => ({
      messages,
      isOpen,
      pendingAction,
      sendMessage,
      toggleAssistant,
      confirmAction,
      cancelAction,
    }),
    [messages, isOpen, pendingAction, sendMessage, toggleAssistant, confirmAction, cancelAction]
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

AssistantProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to access the Assistant context.
 * Must be used within an AssistantProvider.
 * @returns {AssistantContextValue} The Assistant context value
 */
export function useAssistant() {
  const context = useContext(AssistantContext);

  if (context === null) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }

  return context;
}

export default AssistantContext;