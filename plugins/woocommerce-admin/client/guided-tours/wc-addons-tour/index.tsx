/**
 * External dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { TourKit, TourKitTypes } from '@woocommerce/components';
import { recordEvent } from '@woocommerce/tracks';
import { useDispatch } from '@wordpress/data';
import { OPTIONS_STORE_NAME } from '@woocommerce/data';
import qs from 'qs';

/**
 * Internal dependencies
 */
import { waitUntilElementTopNotChange } from '../utils';
import { getTourConfig } from './get-config';
import { getSteps } from './get-steps';

const WCAddonsTour = () => {
	const [ showTour, setShowTour ] = useState( false );
	const { updateOptions } = useDispatch( OPTIONS_STORE_NAME );

	const steps = getSteps();
	const defaultAutoScrollBlock: ScrollLogicalPosition = 'center';

	useEffect( () => {
		const query = qs.parse( window.location.search.slice( 1 ) );
		if ( query?.tutorial === 'true' ) {
			const intervalId = waitUntilElementTopNotChange(
				steps[ 0 ].referenceElements?.desktop || '',
				() => {
					const stepName = steps[ 0 ]?.meta?.name;
					setShowTour( true );
					recordEvent( 'in_app_marketplace_tour_started', {
						step: stepName,
					} );
				},
				500
			);
			return () => clearInterval( intervalId );
		}
		// only run once
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	if ( ! showTour ) {
		return null;
	}

	const closeHandler: TourKitTypes.CloseHandler = (
		tourSteps,
		currentStepIndex
	) => {
		setShowTour( false );
		// mark tour as completed
		updateOptions( {
			woocommerce_admin_dismissed_in_app_marketplace_tour: 'yes',
		} );
		// remove `tutorial` from search query, so it's not shown on page refresh
		const url = new URL( window.location.href );
		url.searchParams.delete( 'tutorial' );
		window.history.replaceState( null, '', url );

		if ( steps.length - 1 === currentStepIndex ) {
			recordEvent( 'in_app_marketplace_tour_completed' );
		} else {
			const stepName = tourSteps[ currentStepIndex ]?.meta?.name;
			recordEvent( 'in_app_marketplace_tour_dismissed', {
				step: stepName,
			} );
		}
	};

	const onNextStepHandler = ( previousStepIndex: number ) => {
		const stepName = steps[ previousStepIndex + 1 ]?.meta?.name || '';
		recordEvent( 'in_app_marketplace_tour_step_viewed', {
			step: stepName,
		} );
		// TODO: Maybe scroll to a proper element
	};

	const onPreviousStepHandler = ( previousStepIndex: number ) => {
		// TODO: Maybe scroll to a proper element
		// const step = steps[ previousStepIndex - 1 ];
	};

	const tourConfig = getTourConfig( {
		closeHandler,
		onNextStepHandler,
		onPreviousStepHandler,
		autoScrollBlock: defaultAutoScrollBlock,
		steps,
	} );

	return <TourKit config={ tourConfig } />;
};

export default WCAddonsTour;
