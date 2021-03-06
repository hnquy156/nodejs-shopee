const ProductModel = require(__path_models + 'products');
const SliderModel = require(__path_models + 'sliders');

const collectionName = 'home';
const folderView = `${__path_views_frontend}pages/${collectionName}`;
const layout = __path_views_frontend + 'layouts/layout';
const pageTitle = 'Trang chủ';

module.exports = {
	index: async (req, res, next) => {
		const products 		  = await ProductModel.getListFrontend({task: 'products-new'}, null);
		const specialProducts = await ProductModel.getListFrontend({task: 'products-special'}, null);
		const soldoutProducts = await ProductModel.getListFrontend({task: 'products-soldout'}, null);
		const sliders		  = await SliderModel.getListFrontend({task: 'list'}, null);
		
		res.render(`${folderView}/index`, { 
			layout,
			pageTitle, 
			products,
			specialProducts,
			soldoutProducts,
			sliders
		});
	}
}