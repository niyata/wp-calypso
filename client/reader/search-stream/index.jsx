/**
 * External Dependencies
 */
import React, { PropTypes } from 'react';
import { trim } from 'lodash';
import { localize } from 'i18n-calypso';
import page from 'page';
import classnames from 'classnames';

/**
 * Internal Dependencies
 */
import ControlItem from 'components/segmented-control/item';
import SegmentedControl from 'components/segmented-control';
import CompactCard from 'components/card/compact';
import DocumentHead from 'components/data/document-head';
import SearchInput from 'components/search';
import { recordAction, recordTrack } from 'reader/stats';
import SiteResults from './site-results';
import PostResults from './post-results';
import ReaderMain from 'components/reader-main';
import { addQueryArgs } from 'lib/url';
import SearchStreamHeader, { POSTS } from './search-stream-header';
import { SORT_BY_RELEVANCE, SORT_BY_LAST_UPDATED } from 'state/reader/feed-searches/actions';
import withDimensions from 'lib/with-dimensions';

const WIDE_DISPLAY_CUTOFF = 660;

const updateQueryArg = params =>
	page.replace( addQueryArgs( params, window.location.pathname + window.location.search ) );

const pickSort = sort => ( sort === 'date' ? SORT_BY_LAST_UPDATED : SORT_BY_RELEVANCE );

const SpacerDiv = withDimensions( ( { width, height } ) => (
	<div
		style={ {
			width: `${ width }px`,
			height: `${ height }px`,
		} }
	/>
) );

class SearchStream extends React.Component {
	static propTypes = {
		query: PropTypes.string,
	};

	componentWillReceiveProps( nextProps ) {
		if ( nextProps.query !== this.props.query ) {
			this.updateState( nextProps );
		}
	}

	updateState = ( props = this.props ) => {
		const newState = {
			title: this.getTitle( props ),
		};
		if ( newState.title !== this.state.title ) {
			this.setState( newState );
		}
	};

	getTitle = ( props = this.props ) => {
		return props.query;
	};

	state = {
		selected: POSTS,
		title: this.getTitle(),
	};

	updateQuery = newValue => {
		this.scrollToTop();
		const trimmedValue = trim( newValue ).substring( 0, 1024 );
		if (
			( trimmedValue !== '' && trimmedValue.length > 1 && trimmedValue !== this.props.query ) ||
			newValue === ''
		) {
			updateQueryArg( { q: newValue } );
		}
	};

	scrollToTop = () => {
		window.scrollTo( 0, 0 );
	};

	useRelevanceSort = () => {
		const sort = 'relevance';
		recordAction( 'search_page_clicked_relevance_sort' );
		recordTrack( 'calypso_reader_clicked_search_sort', {
			query: this.props.query,
			sort,
		} );
		updateQueryArg( { sort } );
	};

	useDateSort = () => {
		const sort = 'date';
		recordAction( 'search_page_clicked_date_sort' );
		recordTrack( 'calypso_reader_clicked_search_sort', {
			query: this.props.query,
			sort,
		} );
		updateQueryArg( { sort } );
	};

	handleFixedAreaMounted = ref => this.fixedAreaRef = ref;

	handleSearchTypeSelection = searchType => updateQueryArg( { show: searchType } );

	render() {
		const { query, translate, searchType } = this.props;
		const sortOrder = this.props.postsStore && this.props.postsStore.sortOrder;
		const wideDisplay = this.props.width > WIDE_DISPLAY_CUTOFF;

		let searchPlaceholderText = this.props.searchPlaceholderText;
		if ( ! searchPlaceholderText ) {
			searchPlaceholderText = translate( 'Search billions of WordPress.com posts…' );
		}

		const documentTitle = translate( '%s ‹ Reader', {
			args: this.state.title || this.props.translate( 'Search' ),
		} );

		const TEXT_RELEVANCE_SORT = translate( 'Relevance', {
			comment: 'A sort order, showing the most relevant posts first.',
		} );

		const TEXT_DATE_SORT = translate( 'Date', {
			comment: 'A sort order, showing the most recent posts first.',
		} );

		const searchStreamResultsClasses = classnames( 'search-stream__results', {
			'is-two-columns': !! query,
		} );

		const singleColumnResultsClasses = classnames( 'search-stream__single-column-results', {
			'is-post-results': searchType === POSTS && query,
		} );

		return (
			<div>
				<DocumentHead title={ documentTitle } />
				<div
					className="search-stream__fixed-area"
					style={ { width: this.props.width } }
					ref={ this.handleFixedAreaMounted }
				>
					<CompactCard className="search-stream__input-card">
						<SearchInput
							onSearch={ this.updateQuery }
							onSearchClose={ this.scrollToTop }
							autoFocus={ this.props.autoFocusInput }
							delaySearch={ true }
							delayTimeout={ 500 }
							placeholder={ searchPlaceholderText }
							initialValue={ query || '' }
							value={ query || '' }
						/>
						{ query &&
							<SegmentedControl compact className="search-stream__sort-picker">
								<ControlItem selected={ sortOrder !== 'date' } onClick={ this.useRelevanceSort }>
									{ TEXT_RELEVANCE_SORT }
								</ControlItem>
								<ControlItem selected={ sortOrder === 'date' } onClick={ this.useDateSort }>
									{ TEXT_DATE_SORT }
								</ControlItem>
							</SegmentedControl> }
					</CompactCard>
					{ query &&
						<SearchStreamHeader
							selected={ searchType }
							onSelection={ this.handleSearchTypeSelection }
							wideDisplay={ wideDisplay }
						/> }
				</div>
				<SpacerDiv domTarget={ this.fixedAreaRef } />
				{ wideDisplay &&
					<div className={ searchStreamResultsClasses }>
						<div className="search-stream__post-results">
							<PostResults { ...this.props } />
						</div>
						{ query &&
							<div className="search-stream__site-results">
								<SiteResults
									query={ query }
									sort={ pickSort( sortOrder ) }
									showLastUpdatedDate={ false }
								/>
							</div> }
					</div> }
				{ ! wideDisplay &&
					<div className={ singleColumnResultsClasses }>
						{ ( ( searchType === POSTS || ! query ) && <PostResults { ...this.props } /> ) ||
							<SiteResults
								query={ query }
								sort={ pickSort( sortOrder ) }
								showLastUpdatedDate={ true }
							/> }
					</div> }
			</div>
		);
	}
}

/* eslint-disable */
// wrapping with Main so that we can use withWidth helper to pass down whole width of Main
const wrapWithMain = Component => props => (
	<ReaderMain className="search-stream search-stream__with-sites" wideLayout>
		<Component { ...props } />
	</ReaderMain>
);
/* eslint-enable */

export default localize( wrapWithMain( withDimensions( SearchStream ) ) );
