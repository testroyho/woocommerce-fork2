/**
 * Internal dependencies
 */
import { getFilename, getPatches } from '../utils';

export type TemplateChangeDescription = {
	filePath: string;
	code: string;
	// We could probably move message out into a reporter later
	message: string;
};

export const scanForTemplateChanges = ( content: string, version: string ) => {
	const changes: Map< string, TemplateChangeDescription > = new Map();

	if ( ! content.match( /diff --git a\/(.+)\/templates\/(.+)/g ) ) {
		return changes;
	}

	const matchPatches = /^a\/(.+)\/templates\/(.+)/g;
	// TODO - move to reporting
	// const title = 'Template change detected';
	const patches = getPatches( content, matchPatches );
	const matchVersion = `^(\\+.+\\*.+)(@version)\\s+(${ version.replace(
		/\./g,
		'\\.'
	) }).*`;
	const versionRegex = new RegExp( matchVersion, 'g' );

	for ( const p in patches ) {
		const patch = patches[ p ];
		const lines = patch.split( '\n' );
		const filePath = getFilename( lines[ 0 ] );
		let code = 'warning';

		// TODO - move to reporting
		let message = 'This template may require a version bump!';

		for ( const l in lines ) {
			const line = lines[ l ];

			if ( line.match( versionRegex ) ) {
				code = 'notice';
				message = 'Version bump found';
			}
		}

		changes.set( filePath, { code, message, filePath } );
	}

	return changes;
};