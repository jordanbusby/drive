import { UserDocumentJSON } from '../components/users';
import drive from '../index';

/**
 * 
 */

export function statTimeParse(mtime: string) {
  const re = /(\d+)-(\d+)-(\d+)T(\d+):(\d+)/;
  let [_, year, month, day, hour, minute] = re.exec(mtime) as RegExpExecArray;
  let date = new Date(+year, +month - 1, +day, +hour - 6, +minute).toLocaleString('en-US', { timeZone: "America/Denver" }).replace(/^(\d+\/\d+\/)\d\d(\d+, )(\d+:\d+):\d+(\s[AM|PM])/, '$1$2$3$4');
  return date;
}

export function getLoggedInUser(): Promise<UserDocumentJSON> {
  return new Promise((resolve, reject) => {
    let user = fetch('/api/info/user');

    user.then(response => response.json())
      .then(json => resolve(json))
      .catch(e => reject(e));
  });
}

export async function logout() {

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

  let currentPathArray = drive.state.currentDir.slice(1).split('/');

  const index = currentPathArray.indexOf(folder);

  if (index < 0) {
    console.log(folder);
    return false;
  }

  let path = '/' + currentPathArray.slice(0, index + 1).join('/');

  return path;

}