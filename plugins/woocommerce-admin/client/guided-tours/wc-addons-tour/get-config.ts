/**
 * External dependencies
 */
import { TourKitTypes } from '@woocommerce/components';

export const getTourConfig = ( {
	closeHandler,
	onNextStepHandler,
	onPreviousStepHandler,
	autoScrollBlock,
	steps,
}: {
	closeHandler: TourKitTypes.CloseHandler;
	onNextStepHandler: ( currentStepIndex: number ) => void;
	onPreviousStepHandler: ( currentStepIndex: number ) => void;
	autoScrollBlock: ScrollLogicalPosition;
	steps: TourKitTypes.WooStep[];
} ): TourKitTypes.WooConfig => {
	return {
		placement: 'auto',
		options: {
			effects: {
				spotlight: {
					interactivity: {
						enabled: true,
						rootElementSelector: '.woocommerce.wc-addons-wrap',
					},
				},
				arrowIndicator: true,
				autoScroll: {
					behavior: 'auto',
					block: autoScrollBlock,
				},
				liveResize: {
					mutation: true,
					resize: true,
					rootElementSelector: '.woocommerce.wc-addons-wrap',
				},
			},
			popperModifiers: [
				{
					name: 'arrow',
					options: {
						padding: ( {
							popper,
						}: {
							popper: { width: number };
						} ) => {
							return {
								// Align the arrow to the left of the popper.
								right: popper.width - 34,
							};
						},
					},
				},
				{
					name: 'offset',
					options: {
						offset: [ 20, 20 ],
					},
				},
				{
					name: 'flip',
					options: {
						allowedAutoPlacements: [ 'right', 'bottom', 'top' ],
					},
				},
			],
			callbacks: {
				onNextStep: onNextStepHandler,
				onPreviousStep: onPreviousStepHandler,
			},
		},
		steps,
		closeHandler,
	};
};
