/**
 * External dependencies
 */
import Analyzer from 'code-analyzer/src/commands/analyzer';
import semver from 'semver';
import { promises } from 'fs';
import { writeFile } from 'fs/promises';

/**
 * Internal dependencies
 */
import { program } from '../program';
import { renderTemplate } from '../lib/render-template';
import { processChanges } from '../lib/process-changes';
import { createWpComDraftPost } from '../lib/draft-post';
import { generateContributors } from '../lib/contributors';
import { Logger } from '../lib/logger';

const VERSION_VALIDATION_REGEX =
	/^([0-9]+)\.([0-9]+)\.([0-9]+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+)?$/;

// Define the release post command
program
	.command( 'release' )
	.description( 'CLI to automate generation of a release post.' )
	.argument(
		'<currentVersion>',
		'The version of the plugin to generate a post for, please use the tag version from Github.'
	)
	.option( '--outputOnly', 'Only output the post, do not publish it' )
	.option(
		'--previousVersion <previousVersion>',
		'If you would like to compare against a version other than last minor you can provide a tag version from Github.'
	)
	.action( async ( currentVersion, options ) => {
		const previousVersion = options.previousVersion
			? semver.parse( options.previousVersion )
			: semver.parse( currentVersion );

		if ( ! options.previousVersion && previousVersion ) {
			previousVersion.minor -= 1;
			previousVersion.format();
		}

		if ( previousVersion && previousVersion.major ) {
			// e.g 6.8.0 -> 6.7.0
			const isOutputOnly = !! options.outputOnly;

			if ( ! VERSION_VALIDATION_REGEX.test( previousVersion.raw ) ) {
				throw new Error(
					`Invalid previous version: ${ previousVersion.raw }`
				);
			}
			if ( ! VERSION_VALIDATION_REGEX.test( currentVersion ) ) {
				throw new Error(
					`Invalid current version: ${ currentVersion }`
				);
			}

			// generates a `changes.json` file in the current directory.
			await Analyzer.run( [
				currentVersion,
				currentVersion,
				'-s',
				'https://github.com/woocommerce/woocommerce.git',
				'-b',
				previousVersion.toString(),
			] );

			const changes = JSON.parse(
				await promises.readFile(
					process.cwd() + '/changes.json',
					'utf8'
				)
			);

			const changeset = processChanges( changes );

			Logger.startTask( 'Finding contributors' );
			const title = `WooCommerce ${ currentVersion } Released`;

			const contributors = await generateContributors(
				currentVersion,
				previousVersion.toString()
			);

			const html = await renderTemplate( 'release.ejs', {
				contributors,
				title,
				changes: changeset,
				displayVersion: currentVersion,
			} );

			Logger.endTask();

			if ( isOutputOnly ) {
				await writeFile( 'changes.html', html );
				Logger.notice(
					`Output written to ${ process.cwd() }/changes.html`
				);
			} else {
				Logger.startTask( 'Publishing draft release post' );

				const response = await createWpComDraftPost(
					'96396764',
					'authToken',
					title,
					html
				);

				Logger.notice(
					`Published draft release post at ${ response.URL }`
				);
				Logger.endTask();
			}
		} else {
			throw new Error(
				`Could not find previous version for ${ currentVersion }`
			);
		}
	} );