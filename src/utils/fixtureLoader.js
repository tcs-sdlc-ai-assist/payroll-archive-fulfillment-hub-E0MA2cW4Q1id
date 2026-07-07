import { DATA_PATHS } from './constants';

/**
 * In-memory cache for loaded fixtures.
 * Keys are file paths, values are Promises that resolve to parsed JSON.
 * @type {Map<string, Promise<any>>}
 */
const fixtureCache = new Map();

/**
 * Loads a static JSON fixture from the /data/ directory via fetch().
 * Results are cached so subsequent calls with the same fileName
 * return the same Promise without making redundant network requests.
 *
 * @param {string} fileName - The path to the JSON file (e.g., '/data/employees.json')
 *   Can also be just the file name (e.g., 'employees.json'), which will be
 *   resolved to '/data/employees.json'.
 * @returns {Promise<any>} A Promise that resolves to the parsed JSON data
 * @throws {Error} If the fetch fails or the response is not OK
 */
export async function loadFixture(fileName) {
  if (!fileName || typeof fileName !== 'string') {
    throw new Error('loadFixture requires a valid file name string');
  }

  const filePath = fileName.startsWith('/') ? fileName : `/data/${fileName}`;

  if (fixtureCache.has(filePath)) {
    return fixtureCache.get(filePath);
  }

  const fetchPromise = fetch(filePath)
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Failed to load fixture "${filePath}": ${response.status} ${response.statusText}`
        );
      }
      return response.json();
    })
    .catch((error) => {
      fixtureCache.delete(filePath);
      throw error;
    });

  fixtureCache.set(filePath, fetchPromise);

  return fetchPromise;
}

/**
 * Loads the employees JSON fixture.
 * @returns {Promise<Object[]>} A Promise that resolves to the array of employee objects
 */
export function loadEmployees() {
  return loadFixture(DATA_PATHS.EMPLOYEES);
}

/**
 * Loads the documents JSON fixture.
 * @returns {Promise<Object[]>} A Promise that resolves to the array of document objects
 */
export function loadDocuments() {
  return loadFixture(DATA_PATHS.DOCUMENTS);
}

/**
 * Loads the audit log JSON fixture.
 * @returns {Promise<Object[]>} A Promise that resolves to the array of audit event objects
 */
export function loadAuditLog() {
  return loadFixture(DATA_PATHS.AUDIT_LOG);
}

/**
 * Loads the archive health JSON fixture.
 * @returns {Promise<Object>} A Promise that resolves to the archive health data object
 */
export function loadArchiveHealth() {
  return loadFixture(DATA_PATHS.ARCHIVE_HEALTH);
}

/**
 * Loads the users JSON fixture.
 * @returns {Promise<Object[]>} A Promise that resolves to the array of user objects
 */
export function loadUsers() {
  return loadFixture(DATA_PATHS.USERS);
}

/**
 * Loads the assistant responses JSON fixture.
 * @returns {Promise<Object>} A Promise that resolves to the assistant responses data object
 */
export function loadAssistantResponses() {
  return loadFixture(DATA_PATHS.ASSISTANT_RESPONSES);
}

/**
 * Clears the fixture cache, forcing subsequent calls to re-fetch data.
 * Useful for testing or when data needs to be refreshed.
 */
export function clearFixtureCache() {
  fixtureCache.clear();
}