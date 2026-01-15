import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import * as bootstrap from "bootstrap";
const VITE_API_BASE = import.meta.env.VITE_API_BASE;
const VITE_API_PATH = import.meta.env.VITE_API_PATH;
const INITIAL_TEMPLATE_DATA = {
  id: "",
  title: "",
  category: "",
  origin_price: "",
  price: "",
  unit: "",
  description: "",
  content: "",
  is_enabled: false,
  imageUrl: "",
  imagesUrl: [],
};

function App() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isAuth, setIsAuth] = useState(false);
  const [products, setProducts] = useState([]);
  const [templateProduct, setTemplateProduct] = useState(INITIAL_TEMPLATE_DATA);
  const [ modalType, setModalType ] = useState(""); // 'create', 'edit', 'delete'
  const productModalRef = useRef(null);

  useEffect(() => {
    const token = document.cookie.replace(
      /(?:(?:^|.*;\s*)hexToken\s*=\s*([^;]*).*$)|^.*$/,
      "$1"
    );
    axios.defaults.headers.common.Authorization = token;
    productModalRef.current = new bootstrap.Modal('#productModal', {
      keyboard: false
    });

    // Modal 關閉時移除焦點
    document
    .querySelector("#productModal")
    .addEventListener("hide.bs.modal", () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });

    checkAdmin();

  }, []);

  const openProductModal = (type, product) => {
    setModalType(type);
    setTemplateProduct((pre) => ({
      ...pre,
      ...product,
    }));
    productModalRef.current.show();
  };

  const closeProductModal = () => {
    productModalRef.current.hide();
  };

  const checkAdmin = async () => {
    try {
      await axios.post(`${VITE_API_BASE}/api/user/check`);
      setIsAuth(true);
    } catch (err) {
      setIsAuth(false);
      console.log(err.response.data.message);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const getProducts = async () => {
    try {
      const response = await axios.get(`${VITE_API_BASE}/api/${VITE_API_PATH}/products`);
      setProducts(response.data.products);
    } catch (err) {
      alert("無法取得產品列表" + err.response.data.message);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${VITE_API_BASE}/admin/signin`, formData);
      const { token, expired } = response.data;
      document.cookie = `hexToken=${token};expires=${new Date(expired)};`;
      axios.defaults.headers.common.Authorization = token;
      getProducts();
      setIsAuth(true);
    } catch (error) {
      setIsAuth(false);
      alert("登入失敗: " + error.response.data.message);
    }
  };

  // 取得產品列表
  useEffect(() => {
    if (isAuth) {
      getProducts();
    }
  }, [isAuth]);

  // 處理輸入框變更
  const handleModelInputChange = (e) => {
    const { id, value, checked, type } = e.target;
    setTemplateProduct((prevProduct) => ({
      ...prevProduct,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  // 處理多圖片輸入框變更
  const handleModelImageChange = (index, value) => {
    setTemplateProduct((prevProduct) => {
      const newImages = [...prevProduct.imagesUrl];
      newImages[index] = value;

      // 填寫最後一個空輸入框時，自動新增空白輸入框
    if (
      value !== "" &&
      index === newImages.length - 1 &&
      newImages.length < 5
    ) {
      newImages.push("");
    }

    // 清空輸入框時，移除最後的空白輸入框
    if (
        value === "" &&
        newImages.length > 1 &&
        newImages[newImages.length - 1] === ""
      ) {
      newImages.pop();
    }

      return {
        ...prevProduct,
        imagesUrl: newImages,
      };
    });
  };

  // 新增圖片輸入框
  const handleAddImage = () => {
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl];
      if (newImage.length < 5) {
        newImage.push("");
      }
      return {
        ...pre,
        imagesUrl: newImage,
      };
    })
  };

  // 刪除圖片輸入框
  const handleRemoveImage = (index) => {
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl];
      if (newImage.length > 1) {
        newImage.splice(index, 1);
      }
      return {
        ...pre,
        imagesUrl: newImage,
      };
    })
  };

  // 更新產品
  const updateProduct = async (id) => {
    let url = `${VITE_API_BASE}/api/${VITE_API_PATH}/admin/product`;
    let method = "post";
    if (modalType === "edit") {
      url = `${VITE_API_BASE}/api/${VITE_API_PATH}/admin/product/${id}`;
      method = "put";
    }

    // 整理產品資料
    const productData = {
      data: {
        ...templateProduct,
        origin_price: Number(templateProduct.origin_price),
        price: Number(templateProduct.price),
        is_enabled: templateProduct.is_enabled ? 1 : 0,
        // 防止 imagesUrl 為空陣列
        imagesUrl: [...templateProduct.imagesUrl.filter((url) => url !== "")],
      }
    }

    try {
      // [method] 動態設定 axios 方法
      await axios[method](url, productData);
      alert("產品更新成功");
      getProducts();
      closeProductModal();
    } catch (error) {
      alert("產品更新失敗: " + error.response.data.message);
    }
  };

  // 刪除產品
  const deleteProduct = async (id) => {
    try {
      await axios.delete(`${VITE_API_BASE}/api/${VITE_API_PATH}/admin/product/${id}`);
      alert("產品刪除成功");
      getProducts();
      closeProductModal();
    } catch (error) {
      alert("產品刪除失敗: " + error.response.data.message);
    }
  };

  return (
    <>
      {isAuth ? (
        <div>
          <div className="container">
            <div className="text-end mt-4">
              <button
                className="btn btn-primary"
                onClick={() => openProductModal("create", INITIAL_TEMPLATE_DATA)}>
                  建立新的產品
              </button>
            </div>
            <table className="table mt-4">
              <thead>
                <tr>
                  <th width="120">分類</th>
                  <th>產品名稱</th>
                  <th width="120">原價</th>
                  <th width="120">售價</th>
                  <th width="100">是否啟用</th>
                  <th width="120">編輯</th>
                </tr>
              </thead>
              <tbody>
              {products.map((item) => (
                <tr key={item.id}>
                  <td>{item.category}</td>
                  <td>{item.title}</td>
                  <td className="text-end">{item.origin_price}</td>
                  <td className="text-end">{item.price}</td>
                  <td>
                    {item.is_enabled ? (
                      <span className="text-success">啟用</span>
                    ) : (
                      <span>未啟用</span>
                    )}
                  </td>
                  <td>
                    <div className="btn-group">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => openProductModal("edit", item)}
                      >
                        編輯
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => openProductModal("delete", item)}
                      >
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="container login">
          <div className="row justify-content-center">
            <h1 className="h3 mb-3 font-weight-normal">請先登入</h1>
            <div className="col-8">
              <form id="form" className="form-signin" onSubmit={handleSubmit}>
                <div className="form-floating mb-3">
                  <input
                    type="email"
                    className="form-control"
                    id="username"
                    placeholder="name@example.com"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    autoFocus
                    />
                  <label htmlFor="username">Email address</label>
                </div>
                <div className="form-floating">
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    />
                  <label htmlFor="password">Password</label>
                </div>
                <button
                  className="btn btn-lg btn-primary w-100 mt-3"
                  type="submit"
                  >
                  登入
                </button>
              </form>
            </div>
          </div>
          <p className="mt-5 mb-3 text-muted">&copy; 2024~∞ - 六角學院</p>
        </div>
      )}
      <div
        id="productModal"
        className="modal fade"
        tabIndex="-1"
        aria-labelledby="productModalLabel"
        aria-hidden="true"
        ref={productModalRef}
        >
        <div className="modal-dialog modal-xl">
          <div className="modal-content border-0">
            <div className={`modal-header bg-${modalType === 'delete' ? 'danger' : 'dark'} text-white`}>
              <h5 id="productModalLabel" className="modal-title">
                <span>{modalType === 'delete' ? '刪除' :
                  modalType === 'edit' ? '編輯' : '新增'}產品</span>
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                ></button>
            </div>
            {
              modalType === 'delete' ? (
                  <div className="modal-body">
                    <p>是否刪除
                      <span className="text-danger">
                        <strong>{templateProduct.title}</strong>
                      </span> 產品？</p>
                  </div>
              ) : (
                <div className="modal-body">
                  <div className="row">
                  <div className="col-sm-4">
                    <div className="mb-2">
                      <label htmlFor="imageUrl" className="form-label">
                        輸入主要圖片網址
                      </label>
                      <input
                        id="imageUrl"
                        type="text"
                        className="form-control"
                        placeholder="請輸入圖片網址"
                        value={templateProduct.imageUrl}
                        onChange={(e) => handleModelInputChange(e)}
                      />
                      {
                        templateProduct.imageUrl &&
                        <img src={templateProduct.imageUrl} alt="主要圖片" className="img-fluid" />
                      }
                    </div>
                    <div className="mb-2">
                      {
                        templateProduct.imagesUrl.map((url, index) => (
                          <div key={index} className="mb-3">
                            <label htmlFor="imageUrl" className="form-label">
                              輸入圖片網址
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder={`請輸入圖片網址 ${index + 1}`}
                              value={url}
                              onChange={(e) => handleModelImageChange(index, e.target.value)}
                            />
                            {
                              url && (
                                <img
                                  className="img-fluid"
                                  src={url}
                                  alt={`副圖${index + 1}`}
                                />
                              )
                            }
                          </div>
                        ))
                      }
                    </div>
                    <div>
                      {
                        templateProduct.imagesUrl.length < 5 &&
                        templateProduct.imagesUrl[templateProduct.imagesUrl.length - 1] !== "" &&
                        <button className="btn btn-outline-primary btn-sm d-block w-100" onClick={() => handleAddImage()}>
                          新增圖片
                        </button>
                      }
                    </div>
                    <div>
                      {
                        templateProduct.imagesUrl.length >= 1 &&
                        <button className="btn btn-outline-danger btn-sm d-block w-100" onClick={() => handleRemoveImage()}>
                          刪除圖片
                        </button>
                      }
                    </div>
                  </div>
                  <div className="col-sm-8">
                    <div className="mb-3">
                      <label htmlFor="title" className="form-label">標題</label>
                      <input
                        id="title"
                        type="text"
                        className="form-control"
                        placeholder="請輸入標題"
                        value={templateProduct.title}
                        onChange={(e) => handleModelInputChange(e)}
                        />
                    </div>

                    <div className="row">
                      <div className="mb-3 col-md-6">
                        <label htmlFor="category" className="form-label">分類</label>
                        <input
                          id="category"
                          type="text"
                          className="form-control"
                          placeholder="請輸入分類"
                          value={templateProduct.category}
                          onChange={(e) => handleModelInputChange(e)}
                          />
                      </div>
                      <div className="mb-3 col-md-6">
                        <label htmlFor="unit" className="form-label">單位</label>
                        <input
                          id="unit"
                          type="text"
                          className="form-control"
                          placeholder="請輸入單位"
                          value={templateProduct.unit}
                          onChange={(e) => handleModelInputChange(e)}
                          />
                      </div>
                    </div>

                    <div className="row">
                      <div className="mb-3 col-md-6">
                        <label htmlFor="origin_price" className="form-label">原價</label>
                        <input
                          id="origin_price"
                          type="number"
                          min="0"
                          className="form-control"
                          placeholder="請輸入原價"
                          value={templateProduct.origin_price}
                          onChange={(e) => handleModelInputChange(e)}
                        />
                      </div>
                      <div className="mb-3 col-md-6">
                        <label htmlFor="price" className="form-label">售價</label>
                        <input
                          id="price"
                          type="number"
                          min="0"
                          className="form-control"
                          placeholder="請輸入售價"
                          value={templateProduct.price}
                          onChange={(e) => handleModelInputChange(e)}
                        />
                      </div>
                    </div>
                    <hr />

                    <div className="mb-3">
                      <label htmlFor="description" className="form-label">產品描述</label>
                      <textarea
                        id="description"
                        className="form-control"
                        placeholder="請輸入產品描述"
                        value={templateProduct.description}
                        onChange={(e) => handleModelInputChange(e)}
                        ></textarea>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="content" className="form-label">說明內容</label>
                      <textarea
                        id="content"
                        className="form-control"
                        placeholder="請輸入說明內容"
                        value={templateProduct.content}
                        onChange={(e) => handleModelInputChange(e)}
                        ></textarea>
                    </div>
                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          id="is_enabled"
                          className="form-check-input"
                          type="checkbox"
                          checked={Boolean(templateProduct.is_enabled)}
                          onChange={(e) => handleModelInputChange(e)}
                          />
                        <label className="form-check-label" htmlFor="is_enabled">
                          是否啟用
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )
            }
            <div className="modal-footer">
              {
                modalType === 'delete' ? (
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => deleteProduct(templateProduct.id)}
                    >
                      刪除
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      data-bs-dismiss="modal"
                      onClick={() => closeProductModal()}
                      >
                      取消
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => updateProduct(templateProduct.id)}>
                        確認
                    </button>
                  </>
                )
              }

            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
