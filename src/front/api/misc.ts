import { UserDocumentJSON } from '../components/users';
import drive from '../index';

/**
 *
 */

export function statTimeParse(mtime: string): string {
  const re = /(\d+)-(\d+)-(\d+)T(\d+):(\d+)/;
  const [_, year, month, day, hour, minute] = re.exec(mtime) as RegExpExecArray;
  const date = new Date(+year, +month - 1, +day, +hour - 6, +minute).toLocaleString('en-US', { timeZone: 'America/Denver' }).replace(/^(\d+\/\d+\/)\d\d(\d+, )(\d+:\d+):\d+(\s[AM|PM])/, '$1$2$3$4');
  return date;
}

export function getLoggedInUser(): Promise<UserDocumentJSON> {
  return new Promise((resolve, reject) => {
    const user = fetch('/api/info/user');

    user.then((response) => response.json())
      .then((json) => resolve(json))
      .catch((e) => reject(e));
  });
}

export async function logout(): Promise<unknown> {
  const response = await fetch('/logout', { method: 'post' });

  return response.json();
}

/**
 *
 * Finds the full path for a folder name in the current path,
 * and returns that string.
 *
 */
export function findPath(folder: string): string | false {
  if (!folder.length) {
    console.log('!folder.length');
    return false;
  }

  const currentPathArray = drive.state.currentDir.slice(1).split('/');

  const index = currentPathArray.indexOf(folder);

  if (index < 0) {
    console.log(folder);
    return false;
  }

  const path = `/${currentPathArray.slice(0, index + 1).join('/')}`;

  return path;
}
